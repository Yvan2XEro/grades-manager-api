import { useMutation } from "@tanstack/react-query";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

type ParsedRow = {
	classCourseId: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	room?: string;
	roomId?: string;
};

type PreviewResult = Awaited<
	ReturnType<typeof trpcClient.timetable.previewBulkImport.mutate>
>;

type ClassCourse = {
	id: string;
	code: string;
	courseRef: { name: string } | null;
	classRef: { name: string } | null;
};

export function TimetableImportDialog({
	open,
	onOpenChange,
	onImported,
	classCourses = [],
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onImported: () => void;
	classCourses?: ClassCourse[];
}) {
	const { t } = useTranslation();
	const fileRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<PreviewResult | null>(null);
	const [skipDuplicates, setSkipDuplicates] = useState(true);
	const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

	const previewMut = useMutation({
		mutationFn: (rows: ParsedRow[]) =>
			trpcClient.timetable.previewBulkImport.mutate({ rows }),
		onSuccess: (data) => {
			setPreview(data);
			setStep("preview");
		},
		onError: (e) => toast.error(e.message),
	});

	const importMut = useMutation({
		mutationFn: () =>
			trpcClient.timetable.executeBulkImport.mutate({
				rows: preview!.valid,
				skipDuplicates,
			}),
		onSuccess: (result) => {
			toast.success(
				t("teacher.timetable.import.success", {
					count: result.created,
					skipped: result.skipped,
				}),
			);
			onImported();
			handleClose();
		},
		onError: (e) => toast.error(e.message),
	});

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			complete: ({ data }) => {
				const rows = data.map((r) => ({
					classCourseId: r.classCourseId ?? "",
					dayOfWeek: r.dayOfWeek ?? "",
					startTime: r.startTime ?? "",
					endTime: r.endTime ?? "",
					room: r.room || undefined,
					roomId: r.roomId || undefined,
				}));
				previewMut.mutate(rows);
			},
		});
	}

	function handleClose() {
		onOpenChange(false);
		setPreview(null);
		setStep("upload");
		if (fileRef.current) fileRef.current.value = "";
	}

	function downloadTemplate() {
		const header =
			"courseName,className,classCourseId,dayOfWeek,startTime,endTime,room";
		let rows: string;
		if (classCourses.length > 0) {
			rows = classCourses
				.map((cc) => {
					const course = cc.courseRef?.name ?? cc.code;
					const klass = cc.classRef?.name ?? "";
					return `${course},${klass},${cc.id},,,, `;
				})
				.join("\n");
		} else {
			rows = [
				"Mathématiques,L1 Info,<id-class-course>,mon,08:00,10:00,Amphi A",
				"Anglais,L1 Info,<id-class-course>,tue,10:00,12:00,Salle 201",
			].join("\n");
		}
		const blob = new Blob([`${header}\n${rows}`], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "timetable-import-template.csv";
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("teacher.timetable.import.title")}</DialogTitle>
				</DialogHeader>

				<DialogBody className="space-y-4">
					{step === "upload" && (
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								{t("teacher.timetable.import.description")}
							</p>
							<Button variant="outline" size="sm" onClick={downloadTemplate}>
								{t("teacher.timetable.import.downloadTemplate")}
							</Button>
							<div className="space-y-1.5">
								<Label>{t("teacher.timetable.import.file")}</Label>
								<input
									ref={fileRef}
									type="file"
									accept=".csv"
									className="text-sm"
									onChange={handleFile}
								/>
							</div>
							{previewMut.isPending && (
								<p className="text-muted-foreground text-sm">…</p>
							)}
						</div>
					)}

					{step === "preview" && preview && (
						<div className="space-y-4">
							<div className="flex gap-3 text-sm">
								<Badge variant="default">
									{preview.valid.length}{" "}
									{t("teacher.timetable.import.validRows")}
								</Badge>
								{preview.errors.length > 0 && (
									<Badge variant="destructive">
										{preview.errors.length}{" "}
										{t("teacher.timetable.import.errorRows")}
									</Badge>
								)}
							</div>

							{preview.errors.length > 0 && (
								<div className="max-h-40 overflow-y-auto rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													{t("teacher.timetable.import.row")}
												</TableHead>
												<TableHead>
													{t("teacher.timetable.import.error")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{preview.errors.map((e) => (
												<TableRow key={e.rowIndex}>
													<TableCell>{e.rowIndex}</TableCell>
													<TableCell className="text-destructive text-xs">
														{e.reason}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}

							{preview.valid.length > 0 && (
								<div className="max-h-48 overflow-y-auto rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													{t("teacher.timetable.import.row")}
												</TableHead>
												<TableHead>{t("teacher.timetable.day")}</TableHead>
												<TableHead>
													{t("teacher.timetable.import.schedule")}
												</TableHead>
												<TableHead>{t("teacher.timetable.room")}</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{preview.valid.map((r) => (
												<TableRow key={r.rowIndex}>
													<TableCell>{r.rowIndex}</TableCell>
													<TableCell className="font-medium uppercase">
														{r.dayOfWeek}
													</TableCell>
													<TableCell>
														{r.startTime}–{r.endTime}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{r.room ?? r.roomId ?? "—"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}

							<div className="flex items-center gap-2">
								<Checkbox
									id="skipDupes"
									checked={skipDuplicates}
									onCheckedChange={(v) => setSkipDuplicates(Boolean(v))}
								/>
								<Label htmlFor="skipDupes" className="font-normal text-sm">
									{t("teacher.timetable.import.skipDuplicates")}
								</Label>
							</div>
						</div>
					)}
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.cancel")}
					</Button>
					{step === "preview" && preview && preview.valid.length > 0 && (
						<Button
							disabled={importMut.isPending}
							onClick={() => importMut.mutate()}
						>
							{t("teacher.timetable.import.execute", {
								count: preview.valid.length,
							})}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
