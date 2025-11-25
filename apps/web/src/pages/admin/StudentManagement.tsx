import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { Download, PlusIcon } from "lucide-react";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

type StudentsListResponse = RouterOutputs["students"]["list"];
type StudentRow = StudentsListResponse["items"][number];

interface Class {
	id: string;
	name: string;
}

const buildStudentSchema = (t: TFunction) =>
	z.object({
		firstName: z.string().min(1, t("admin.students.validation.firstName")),
		lastName: z.string().min(1, t("admin.students.validation.lastName")),
		email: z.string().email(t("admin.students.validation.email")),
		registrationNumber: z
			.string()
			.min(1, t("admin.students.validation.registration")),
		classId: z.string().min(1, t("admin.students.validation.class")),
	});

type StudentForm = z.infer<ReturnType<typeof buildStudentSchema>>;
type BulkStudent = {
	firstName: string;
	lastName: string;
	email: string;
	registrationNumber: string;
	phone?: string;
	gender?: "male" | "female" | "other";
	dateOfBirth?: string;
	placeOfBirth?: string;
	nationality?: string;
};

const getStudentName = (student: StudentRow) =>
	[student.profile.firstName, student.profile.lastName]
		.filter(Boolean)
		.join(" ");

const normalizeGender = (value?: string | null) => {
	if (!value) return undefined;
	const normalized = value.trim().toLowerCase();
	if (["male", "m", "homme"].includes(normalized)) return "male";
	if (["female", "f", "femme"].includes(normalized)) return "female";
	if (["other", "autre", "o"].includes(normalized)) return "other";
	return undefined;
};

const formatStudentGender = (
	t: TFunction,
	gender?: StudentRow["profile"]["gender"],
) => {
	if (!gender) return t("admin.students.table.genderUnknown");
	return t(`admin.students.gender.${gender}`, { defaultValue: gender });
};

const formatDate = (value?: Date | string | null) => {
	if (!value) return "—";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return format(date, "PPP");
};

const toInputDate = (value?: Date | string | null) => {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().split("T")[0];
};

const toISODateFromInput = (value?: string) => {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

const toISODateFromSheet = (value?: string | number) => {
	if (value === undefined || value === null || value === "") return undefined;
	if (typeof value === "number") {
		const parsed = XLSX.SSF?.parse_date_code?.(value);
		if (!parsed) return undefined;
		const jsDate = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
		return jsDate.toISOString();
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

export default function StudentManagement() {
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const [classFilter, setClassFilter] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [cursor, setCursor] = useState<string | undefined>();
	const [prevCursors, setPrevCursors] = useState<string[]>([]);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"single" | "import">("single");
	const [importClass, setImportClass] = useState("");
	const [importResult, setImportResult] = useState<{
		createdCount: number;
		conflicts: Array<{ row: number; reason: string }>;
		errors: Array<{ row: number; reason: string }>;
	} | null>(null);
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importFileKey, setImportFileKey] = useState(0);

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items as Class[];
		},
	});

	const { data: studentsData } = useQuery<StudentsListResponse>({
		queryKey: ["students", classFilter, search, cursor],
		queryFn: async () =>
			trpcClient.students.list.query({
				classId: classFilter === "all" ? undefined : classFilter,
				q: search || undefined,
				cursor,
				limit: 20,
			}),
	});

	const studentSchema = useMemo(() => buildStudentSchema(t), [t]);

	const form = useForm<StudentForm>({ resolver: zodResolver(studentSchema) });

	const createMutation = useMutation({
		mutationFn: (data: StudentForm) => trpcClient.students.create.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.students.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["students"] });
			closeModal();
		},
		onError: (err: unknown) =>
			toast.error(
				err instanceof Error
					? err.message
					: t("admin.students.toast.createError"),
			),
	});

	const bulkMutation = useMutation({
		mutationFn: (payload: { classId: string; students: BulkStudent[] }) =>
			trpcClient.students.bulkCreate.mutate(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["students"] });
		},
		onError: (err: unknown) =>
			toast.error(
				err instanceof Error
					? err.message
					: t("admin.students.toast.importError"),
			),
	});

	const onSubmit = (data: StudentForm) => createMutation.mutate(data);

	const handleNext = () => {
		if (studentsData?.nextCursor) {
			setPrevCursors((p) => [...p, cursor ?? ""]);
			setCursor(studentsData.nextCursor);
		}
	};
	const handlePrev = () => {
		const prev = prevCursors[prevCursors.length - 1];
		setPrevCursors((p) => p.slice(0, -1));
		setCursor(prev || undefined);
	};

	const handleDownloadTemplate = () => {
		const header =
			"firstName,lastName,email,phone,dateOfBirth,placeOfBirth,gender,nationality,registrationNumber\n";
		const csvBlob = new Blob([header], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(csvBlob);
		a.download = `${t("admin.students.templates.filePrefix")}.csv`;
		a.click();

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([
			[
				"firstName",
				"lastName",
				"email",
				"phone",
				"dateOfBirth",
				"placeOfBirth",
				"gender",
				"nationality",
				"registrationNumber",
			],
		]);
		XLSX.utils.book_append_sheet(
			wb,
			ws,
			t("admin.students.templates.sheetName"),
		);
		XLSX.writeFile(wb, `${t("admin.students.templates.filePrefix")}.xlsx`);
	};

	const handleImport = async (file: File) => {
		if (!importClass) {
			toast.error(
				t("admin.students.import.classLabel", {
					defaultValue: "Select class",
				}),
			);
			return;
		}
		const ext = file.name.split(".").pop()?.toLowerCase();
		const rows: BulkStudent[] = [];
		const formatErrors: Array<{ row: number; reason: string }> = [];

		if (ext === "csv") {
			const text = await file.text();
			const parsed = Papa.parse<Record<string, string>>(text, {
				header: true,
				skipEmptyLines: true,
			});
			parsed.data.forEach((row, idx) => {
				if (
					row.firstName &&
					row.lastName &&
					row.email &&
					row.registrationNumber
				) {
					rows.push({
						firstName: row.firstName,
						lastName: row.lastName,
						email: row.email,
						registrationNumber: row.registrationNumber,
						phone: row.phone || undefined,
						gender: normalizeGender(row.gender),
						dateOfBirth: row.dateOfBirth
							? toISODateFromInput(row.dateOfBirth)
							: undefined,
						placeOfBirth: row.placeOfBirth || undefined,
						nationality: row.nationality || undefined,
					});
				} else {
					formatErrors.push({
						row: idx + 2,
						reason: t("admin.students.import.invalidFormat"),
					});
				}
			});
		} else {
			const buf = await file.arrayBuffer();
			const wb = XLSX.read(buf);
			const sheet = wb.Sheets[wb.SheetNames[0]];
			const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
			json.forEach((row, idx) => {
				if (
					row.firstName &&
					row.lastName &&
					row.email &&
					row.registrationNumber
				) {
					rows.push({
						firstName: row.firstName,
						lastName: row.lastName,
						email: row.email,
						registrationNumber: row.registrationNumber,
						phone: row.phone || undefined,
						gender: normalizeGender(row.gender),
						dateOfBirth: toISODateFromSheet(
							row.dateOfBirth as string | number | undefined,
						),
						placeOfBirth: row.placeOfBirth || undefined,
						nationality: row.nationality || undefined,
					});
				} else {
					formatErrors.push({
						row: idx + 2,
						reason: t("admin.students.import.invalidFormat"),
					});
				}
			});
		}

		if (!rows.length) {
			toast.error(t("admin.students.import.invalidFormat"));
			return;
		}

		bulkMutation.mutate(
			{ classId: importClass, students: rows },
			{
				onSuccess: (res) => {
					setImportResult({
						createdCount: res.createdCount,
						conflicts: res.conflicts.map((c) => ({
							row: c.row,
							reason: c.reason,
						})),
						errors: [...formatErrors, ...res.errors],
					});
					if (formatErrors.length === 0) {
						toast.success(t("admin.students.toast.createSuccess"));
					}
					setImportFile(null);
					setImportFileKey((key) => key + 1);
				},
			},
		);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setActiveTab("single");
		setImportClass("");
		setImportResult(null);
		setImportFile(null);
		setImportFileKey((key) => key + 1);
		form.reset();
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="font-bold text-2xl">{t("admin.students.title")}</h1>
				<Button onClick={() => setIsModalOpen(true)}>
					<PlusIcon className="mr-2 h-5 w-5" />
					{t("admin.students.actions.openModal")}
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={classFilter}
					onValueChange={(value) => {
						setClassFilter(value);
						setCursor(undefined);
						setPrevCursors([]);
					}}
				>
					<SelectTrigger className="min-w-[200px]">
						<SelectValue placeholder={t("admin.students.filters.allClasses")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("admin.students.filters.allClasses")}
						</SelectItem>
						{classes?.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("admin.students.filters.searchPlaceholder")}
					className="w-full max-w-md"
				/>
				<Button
					variant="outline"
					onClick={() => {
						setCursor(undefined);
						setPrevCursors([]);
						queryClient.invalidateQueries({ queryKey: ["students"] });
					}}
				>
					{t("common.actions.search")}
				</Button>
			</div>

			<Card>
				<CardContent className="pb-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.students.table.name")}</TableHead>
								<TableHead>{t("admin.students.table.email")}</TableHead>
								<TableHead>{t("admin.students.table.registration")}</TableHead>
								<TableHead>{t("admin.students.table.gender")}</TableHead>
								<TableHead>{t("admin.students.table.dateOfBirth")}</TableHead>
								<TableHead>{t("admin.students.table.placeOfBirth")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{studentsData?.items.length ? (
								studentsData.items.map((student) => (
									<TableRow key={student.id}>
										<TableCell>{getStudentName(student)}</TableCell>
										<TableCell>{student.profile.primaryEmail}</TableCell>
										<TableCell>{student.registrationNumber}</TableCell>
										<TableCell>
											{formatStudentGender(t, student.profile.gender)}
										</TableCell>
										<TableCell>
											{formatDate(student.profile.dateOfBirth)}
										</TableCell>
										<TableCell>{student.profile.placeOfBirth || "—"}</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="py-6 text-center">
										{t("admin.students.empty", {
											defaultValue: "No students yet for this selection.",
										})}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
				<CardFooter className="flex items-center justify-between gap-3">
					<Button
						variant="outline"
						disabled={prevCursors.length === 0}
						onClick={handlePrev}
					>
						{t("common.pagination.previous")}
					</Button>
					<Button
						variant="outline"
						disabled={!studentsData?.nextCursor}
						onClick={handleNext}
					>
						{t("common.pagination.next")}
					</Button>
				</CardFooter>
			</Card>

			<Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>{t("admin.students.modal.title")}</DialogTitle>
					</DialogHeader>

					<Tabs
						value={activeTab}
						onValueChange={(value) =>
							setActiveTab(value as "single" | "import")
						}
						className="space-y-4"
					>
						<TabsList>
							<TabsTrigger value="single">
								{t("admin.students.modal.tabs.single")}
							</TabsTrigger>
							<TabsTrigger value="import">
								{t("admin.students.modal.tabs.import")}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="single" className="space-y-4">
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-4"
								>
									<FormField
										control={form.control}
										name="firstName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.students.form.firstName")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="lastName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.students.form.lastName")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.students.form.email")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="registrationNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.students.form.registration")}
												</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="classId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.students.form.class")}</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"admin.students.form.classPlaceholder",
																)}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{classes?.map((c) => (
															<SelectItem key={c.id} value={c.id}>
																{c.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="flex justify-end gap-3 pt-2">
										<Button
											type="button"
											variant="outline"
											onClick={closeModal}
										>
											{t("common.actions.cancel")}
										</Button>
										<Button
											type="submit"
											disabled={form.formState.isSubmitting}
										>
											{form.formState.isSubmitting
												? t("common.loading")
												: t("admin.students.form.submit")}
										</Button>
									</div>
								</form>
							</Form>
						</TabsContent>

						<TabsContent value="import" className="space-y-4">
							{!importResult && (
								<>
									<div className="space-y-2">
										<Label htmlFor="import-class-select">
											{t("admin.students.import.classLabel")}
										</Label>
										<Select value={importClass} onValueChange={setImportClass}>
											<SelectTrigger id="import-class-select">
												<SelectValue
													placeholder={t(
														"admin.students.form.classPlaceholder",
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{classes?.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="student-import-file">
											{t("admin.students.import.fileLabel", {
												defaultValue: "Upload CSV or XLSX",
											})}
										</Label>
										<Input
											key={importFileKey}
											id="student-import-file"
											type="file"
											accept=".csv,.xlsx"
											onChange={(e) => {
												const f = e.target.files?.[0] ?? null;
												setImportFile(f);
												setImportResult(null);
											}}
											disabled={!importClass || bulkMutation.isPending}
										/>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={handleDownloadTemplate}
										>
											<Download className="mr-2 h-4 w-4" />
											{t("admin.students.import.downloadTemplate")}
										</Button>
										<Button
											type="button"
											onClick={() => {
												if (importFile) {
													handleImport(importFile);
												}
											}}
											disabled={
												!importClass || !importFile || bulkMutation.isPending
											}
										>
											{bulkMutation.isPending ? (
												<>
													<Spinner className="mr-2 h-4 w-4" />
													{t("common.actions.saving", {
														defaultValue: "Saving...",
													})}
												</>
											) : (
												t("admin.students.import.actions.import", {
													defaultValue: "Import students",
												})
											)}
										</Button>
									</div>
								</>
							)}
							{importResult && (
								<div className="space-y-3 text-sm">
									<p>
										{t("admin.students.import.summary.created", {
											count: importResult.createdCount,
										})}
									</p>
									{importResult.conflicts.length > 0 && (
										<div className="space-y-1">
											<p className="font-semibold">
												{t("admin.students.import.summary.conflicts.title")}
											</p>
											<ul className="ml-4 list-disc">
												{importResult.conflicts.map((c) => (
													<li key={`${c.row}-${c.reason}`}>
														{t("admin.students.import.summary.conflicts.item", {
															row: c.row,
															reason: c.reason,
														})}
													</li>
												))}
											</ul>
										</div>
									)}
									{importResult.errors.length > 0 && (
										<div className="space-y-1">
											<p className="font-semibold">
												{t("admin.students.import.summary.errors.title")}
											</p>
											<ul className="ml-4 list-disc">
												{importResult.errors.map((c) => (
													<li key={`${c.row}-${c.reason}`}>
														{t("admin.students.import.summary.errors.item", {
															row: c.row,
															reason: c.reason,
														})}
													</li>
												))}
											</ul>
										</div>
									)}
									<div className="flex justify-end">
										<Button variant="outline" onClick={closeModal}>
											{t("common.actions.close")}
										</Button>
									</div>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
