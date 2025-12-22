import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Play, TableProperties } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { type RouterOutputs, trpcClient } from "../../utils/trpc";

type AcademicYear = { id: string; name: string };
type ExamType = { id: string; name: string };
type PreviewClass = {
	id: string;
	name: string;
	programId: string;
	programName: string;
	classCourseCount: number;
};
type HistoryItem = RouterOutputs["examScheduler"]["history"]["items"][number];
type RunDetails = RouterOutputs["examScheduler"]["details"];

export default function ExamScheduler() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isScheduleOpen, setIsScheduleOpen] = useState(false);
	const [detailsRunId, setDetailsRunId] = useState<string | null>(null);
	const [academicYearId, setAcademicYearId] = useState("");
	const [examTypeId, setExamTypeId] = useState("");
	const [percentage, setPercentage] = useState(40);
	const [dateStart, setDateStart] = useState("");
	const [dateEnd, setDateEnd] = useState("");
	const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
		new Set(),
	);

	const resetForm = () => {
		setAcademicYearId("");
		setExamTypeId("");
		setPercentage(40);
		setDateStart("");
		setDateEnd("");
		setSelectedClasses(new Set());
	};

	const academicYearsQuery = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({
				limit: 200,
			});
			return items as AcademicYear[];
		},
	});

	const examTypesQuery = useQuery({
		queryKey: ["examTypes"],
		queryFn: async () => {
			const { items } = await trpcClient.examTypes.list.query({ limit: 200 });
			return items as ExamType[];
		},
	});

	const previewEnabled = isScheduleOpen && Boolean(academicYearId);
	const previewQuery = useQuery({
		queryKey: ["examSchedulerPreview", academicYearId],
		enabled: previewEnabled,
		queryFn: async () => {
			if (!academicYearId) return null;
			return trpcClient.examScheduler.preview.query({
				academicYearId,
			});
		},
	});

	const previewClasses = (previewQuery.data?.classes ?? []) as PreviewClass[];
	const previewClassIds = useMemo(
		() => previewClasses.map((klass) => klass.id),
		[previewClasses],
	);

	useEffect(() => {
		if (!previewClassIds.length) {
			setSelectedClasses(new Set());
			return;
		}
		setSelectedClasses((prev) => {
			if (
				prev.size === previewClassIds.length &&
				previewClassIds.every((id) => prev.has(id))
			) {
				return prev;
			}
			return new Set(previewClassIds);
		});
	}, [previewClassIds]);

	const historyQuery = useQuery({
		queryKey: ["examSchedulerHistory"],
		queryFn: () => trpcClient.examScheduler.history.query({ limit: 20 }),
	});
	const historyItems = historyQuery.data?.items ?? [];

	const runDetailsQuery = useQuery({
		queryKey: ["examSchedulerRunDetails", detailsRunId],
		enabled: Boolean(detailsRunId),
		queryFn: async () => {
			if (!detailsRunId) return null;
			return trpcClient.examScheduler.details.query({ runId: detailsRunId });
		},
	});

	const scheduleMutation = useMutation({
		mutationFn: async () => {
			if (
				!academicYearId ||
				!examTypeId ||
				!dateStart ||
				!dateEnd ||
				!selectedClasses.size
			) {
				throw new Error(t("admin.examScheduler.toast.error"));
			}
			await trpcClient.examScheduler.schedule.mutate({
				academicYearId,
				examTypeId,
				percentage,
				dateStart: new Date(dateStart),
				dateEnd: new Date(dateEnd),
				classIds: Array.from(selectedClasses),
			});
		},
		onSuccess: () => {
			toast.success(t("admin.examScheduler.toast.success"));
			queryClient.invalidateQueries({ queryKey: ["examSchedulerHistory"] });
			setIsScheduleOpen(false);
			resetForm();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examScheduler.toast.error");
			toast.error(message);
		},
	});

	const canSubmit =
		Boolean(
			academicYearId &&
				examTypeId &&
				dateStart &&
				dateEnd &&
				selectedClasses.size,
		) &&
		percentage >= 1 &&
		percentage <= 100 &&
		!scheduleMutation.isPending;

	const toggleClass = (id: string) => {
		setSelectedClasses((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const setAllClasses = (checked: boolean) => {
		if (!previewClassIds.length) return;
		setSelectedClasses(checked ? new Set(previewClassIds) : new Set());
	};

	const allClassesSelected =
		previewClassIds.length > 0 &&
		selectedClasses.size === previewClassIds.length;

	const closeDetails = () => setDetailsRunId(null);

	const detailsData = runDetailsQuery.data as RunDetails | null;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-semibold text-3xl">
						{t("admin.examScheduler.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.examScheduler.subtitle")}
					</p>
				</div>
				<Button onClick={() => setIsScheduleOpen(true)}>
					<Play className="mr-2 h-4 w-4" />
					{t("admin.examScheduler.actions.schedule")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.examScheduler.history.title")}</CardTitle>
					<CardDescription>
						{t("admin.examScheduler.history.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{historyQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : historyItems.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>
									{t("admin.examScheduler.history.emptyTitle")}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.examScheduler.history.emptyDescription")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent />
						</Empty>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("admin.exams.table.date")}</TableHead>
										<TableHead>
											{t("admin.examScheduler.form.academicYearLabel")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.form.examTypeLabel")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.form.percentageLabel")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.history.table.classes")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.history.table.created")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.history.table.skipped")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.history.table.duplicates")}
										</TableHead>
										<TableHead>
											{t("admin.examScheduler.history.table.conflicts")}
										</TableHead>
										<TableHead className="text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{historyItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell>
												{format(new Date(item.createdAt), "PPp")}
											</TableCell>
											<TableCell>{item.academicYearName ?? "—"}</TableCell>
											<TableCell>{item.examTypeName ?? "—"}</TableCell>
											<TableCell>{Number(item.percentage)}%</TableCell>
											<TableCell>
												{item.classCount} / {item.classCourseCount}
											</TableCell>
											<TableCell>{item.createdCount}</TableCell>
											<TableCell>{item.skippedCount}</TableCell>
											<TableCell>{item.duplicateCount}</TableCell>
											<TableCell>{item.conflictCount}</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setDetailsRunId(item.id)}
												>
													<TableProperties className="mr-2 h-4 w-4" />
													{t("admin.examScheduler.history.actions.view")}
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={isScheduleOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsScheduleOpen(false);
						resetForm();
					}
				}}
			>
				<DialogContent className="min-w-[80vw] max-w-[90vw]">
					<DialogHeader>
						<DialogTitle>{t("admin.examScheduler.form.title")}</DialogTitle>
						<p className="text-muted-foreground text-sm">
							{t("admin.examScheduler.form.description")}
						</p>
					</DialogHeader>
					<div className="grid gap-6 lg:grid-cols-3">
						<div className="space-y-4 lg:col-span-1">
							<div className="space-y-2">
								<Label>{t("admin.examScheduler.form.academicYearLabel")}</Label>
								<Select
									value={academicYearId}
									onValueChange={(value) => {
										setAcademicYearId(value);
									}}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.examScheduler.form.academicYearPlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{(academicYearsQuery.data ?? []).map((year) => (
											<SelectItem key={year.id} value={year.id}>
												{year.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>{t("admin.examScheduler.form.examTypeLabel")}</Label>
								<Select
									value={examTypeId}
									onValueChange={(value) => setExamTypeId(value)}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.examScheduler.form.examTypePlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{(examTypesQuery.data ?? []).map((type) => (
											<SelectItem key={type.id} value={type.id}>
												{type.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>{t("admin.examScheduler.form.dateStartLabel")}</Label>
									<Input
										type="date"
										value={dateStart}
										onChange={(event) => setDateStart(event.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("admin.examScheduler.form.dateEndLabel")}</Label>
									<Input
										type="date"
										value={dateEnd}
										onChange={(event) => setDateEnd(event.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>{t("admin.examScheduler.form.percentageLabel")}</Label>
								<Input
									type="number"
									min={1}
									max={100}
									value={percentage}
									onChange={(event) =>
										setPercentage(Number(event.target.value) || 0)
									}
								/>
							</div>
							<div className="flex gap-2">
								<Button
									className="flex-1"
									onClick={() => scheduleMutation.mutate()}
									disabled={!canSubmit}
								>
									{scheduleMutation.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									{t("admin.examScheduler.actions.schedule")}
								</Button>
								<Button variant="ghost" type="button" onClick={resetForm}>
									{t("common.actions.reset")}
								</Button>
							</div>
						</div>
						<div className="lg:col-span-2">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<p className="font-medium">
										{t("admin.examScheduler.classes.title")}
									</p>
									<p className="text-muted-foreground text-sm">
										{t("admin.examScheduler.classes.description")}
									</p>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Checkbox
										id="select-all-classes"
										checked={allClassesSelected}
										onCheckedChange={(value) => setAllClasses(value === true)}
										disabled={!previewClasses.length}
									/>
									<Label htmlFor="select-all-classes">
										{t("admin.examScheduler.classes.selectAll")}
									</Label>
								</div>
							</div>
							<div className="rounded-md border">
								{previewQuery.isLoading ? (
									<div className="flex items-center justify-center py-8">
										<Spinner />
									</div>
								) : !previewClasses.length ? (
									<div className="py-12 text-center text-muted-foreground">
										{t("admin.examScheduler.classes.description")}
									</div>
								) : (
									<div className="max-h-[420px] space-y-3 overflow-y-auto p-3">
										{previewClasses.map((klass) => (
											<div
												key={klass.id}
												className="flex items-center justify-between rounded-lg border border-border p-3"
											>
												<div>
													<p className="font-medium">{klass.name}</p>
													<p className="text-muted-foreground text-sm">
														{klass.programName}
													</p>
												</div>
												<div className="flex items-center gap-4">
													<Badge variant="outline">
														{t("admin.exams.table.course")}:{" "}
														{klass.classCourseCount}
													</Badge>
													<Checkbox
														checked={selectedClasses.has(klass.id)}
														onCheckedChange={() => toggleClass(klass.id)}
													/>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(detailsRunId)}
				onOpenChange={(open) => {
					if (!open) closeDetails();
				}}
			>
				<DialogContent className="min-w-[80vw] max-w-[90vw]">
					<DialogHeader>
						<DialogTitle>
							{t("admin.examScheduler.history.details.title")}
						</DialogTitle>
					</DialogHeader>
					{runDetailsQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : !detailsData ? (
						<div className="py-12 text-center text-muted-foreground">
							{t("admin.examScheduler.history.emptyDescription")}
						</div>
					) : (
						<div className="space-y-4">
							<div className="text-muted-foreground text-sm">
								{t("admin.examScheduler.history.details.subtitle", {
									date: format(new Date(detailsData.run.createdAt), "PPp"),
								})}
							</div>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t("admin.examScheduler.history.details.table.exam")}
											</TableHead>
											<TableHead>
												{t("admin.examScheduler.history.details.table.course")}
											</TableHead>
											<TableHead>
												{t("admin.examScheduler.history.details.table.class")}
											</TableHead>
											<TableHead>
												{t("admin.examScheduler.history.details.table.type")}
											</TableHead>
											<TableHead>
												{t("admin.examScheduler.history.details.table.date")}
											</TableHead>
											<TableHead>
												{t("admin.examScheduler.history.details.table.status")}
											</TableHead>
											<TableHead>
												{t("admin.examScheduler.history.details.table.locked")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{detailsData.exams.map((exam) => (
											<TableRow key={exam.id}>
												<TableCell>{exam.name}</TableCell>
												<TableCell>{exam.courseName ?? "—"}</TableCell>
												<TableCell>{exam.className ?? "—"}</TableCell>
												<TableCell>{exam.type}</TableCell>
												<TableCell>
													{format(new Date(exam.date), "PP")}
												</TableCell>
												<TableCell>
													<Badge variant="outline">{exam.status}</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={exam.isLocked ? "default" : "secondary"}
													>
														{exam.isLocked
															? t("admin.exams.status.locked")
															: t("admin.exams.status.open")}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
