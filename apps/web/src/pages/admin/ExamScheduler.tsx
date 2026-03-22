import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Play, RefreshCcw, TableProperties } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { AcademicYearSelect } from "../../components/inputs/AcademicYearSelect";
import { SemesterSelect } from "../../components/inputs/SemesterSelect";
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
import { DatePicker } from "../../components/ui/date-picker";
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
import { TableSkeleton } from "../../components/ui/table-skeleton";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { type RouterOutputs, trpcClient } from "../../utils/trpc";

type ExamType = { id: string; name: string; defaultPercentage: number | null };
type Semester = RouterOutputs["semesters"]["list"]["items"][number];
type PreviewClass = {
	id: string;
	name: string;
	programId: string;
	programName: string;
	classCourseCount: number;
};
type HistoryItem = RouterOutputs["examScheduler"]["history"]["items"][number];
type RunDetails = RouterOutputs["examScheduler"]["details"];
type RetakeExam =
	RouterOutputs["examScheduler"]["previewRetakes"]["exams"][number];
type SessionMode = "normal" | "retake";

export default function ExamScheduler() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isScheduleOpen, setIsScheduleOpen] = useState(false);
	const [detailsRunId, setDetailsRunId] = useState<string | null>(null);
	const [sessionMode, setSessionMode] = useState<SessionMode>("normal");

	// Common form state
	const [academicYearId, setAcademicYearId] = useState("");
	const [semesterId, setSemesterId] = useState("");
	const [dateStart, setDateStart] = useState("");
	const [dateEnd, setDateEnd] = useState("");

	// Normal session state
	const [examTypeId, setExamTypeId] = useState("");
	const [percentage, setPercentage] = useState(40);
	const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
		new Set(),
	);

	// Retake session state
	const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
	const [scoringPolicy, setScoringPolicy] = useState<"replace" | "best_of">(
		"replace",
	);
	const [classFilter, setClassFilter] = useState<string>("");
	const [examTypeFilter, setExamTypeFilter] = useState<string>("");

	const resetForm = () => {
		setAcademicYearId("");
		setSemesterId("");
		setDateStart("");
		setDateEnd("");
		setExamTypeId("");
		setPercentage(40);
		setSelectedClasses(new Set());
		setSelectedExams(new Set());
		setScoringPolicy("replace");
		setClassFilter("");
		setExamTypeFilter("");
	};

	const examTypesQuery = useQuery({
		queryKey: ["examTypes"],
		queryFn: async () => {
			const { items } = await trpcClient.examTypes.list.query({
				limit: 200,
			});
			return items as ExamType[];
		},
	});

	const semestersQuery = useQuery({
		queryKey: ["semesters"],
		queryFn: async () => {
			const result = await trpcClient.semesters.list.query({
				limit: 200,
			});
			return result.items as Semester[];
		},
	});
	const semesters = semestersQuery.data ?? [];

	const classesQuery = useQuery({
		queryKey: ["classes", academicYearId],
		enabled: Boolean(academicYearId),
		queryFn: async () => {
			const result = await trpcClient.classes.list.query({
				academicYearId,
				limit: 500,
			});
			return result.items;
		},
	});
	const classes = classesQuery.data ?? [];

	// Normal session preview
	const previewEnabled =
		isScheduleOpen &&
		sessionMode === "normal" &&
		Boolean(academicYearId) &&
		Boolean(semesterId);
	const previewQuery = useQuery({
		queryKey: ["examSchedulerPreview", academicYearId, semesterId],
		enabled: previewEnabled,
		queryFn: async () => {
			if (!academicYearId || !semesterId) return null;
			return trpcClient.examScheduler.preview.query({
				academicYearId,
				semesterId,
			});
		},
	});

	const previewClasses = (previewQuery.data?.classes ?? []) as PreviewClass[];
	const previewClassIds = useMemo(
		() => previewClasses.map((klass) => klass.id),
		[previewClasses],
	);

	useEffect(() => {
		if (sessionMode !== "normal" || !previewClassIds.length) {
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
	}, [previewClassIds, sessionMode]);

	// Retake session preview
	const retakePreviewEnabled =
		isScheduleOpen &&
		sessionMode === "retake" &&
		Boolean(academicYearId) &&
		Boolean(semesterId);
	const retakePreviewQuery = useQuery({
		queryKey: [
			"examSchedulerRetakePreview",
			academicYearId,
			semesterId,
			examTypeFilter,
			classFilter,
		],
		enabled: retakePreviewEnabled,
		queryFn: async () => {
			if (!academicYearId || !semesterId) return null;
			return trpcClient.examScheduler.previewRetakes.query({
				academicYearId,
				semesterId,
				examTypeId: examTypeFilter || undefined,
				classId: classFilter || undefined,
			});
		},
	});

	const retakeExams = (retakePreviewQuery.data?.exams ?? []) as RetakeExam[];
	const retakeExamIds = useMemo(
		() => retakeExams.map((exam) => exam.id),
		[retakeExams],
	);

	useEffect(() => {
		if (sessionMode !== "retake" || !retakeExamIds.length) {
			setSelectedExams(new Set());
			return;
		}
		setSelectedExams((prev) => {
			if (
				prev.size === retakeExamIds.length &&
				retakeExamIds.every((id) => prev.has(id))
			) {
				return prev;
			}
			return new Set(retakeExamIds);
		});
	}, [retakeExamIds, sessionMode]);

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
			return trpcClient.examScheduler.details.query({
				runId: detailsRunId,
			});
		},
	});

	// Normal session mutation
	const scheduleMutation = useMutation({
		mutationFn: async () => {
			if (
				!academicYearId ||
				!examTypeId ||
				!semesterId ||
				!dateStart ||
				!dateEnd ||
				!selectedClasses.size
			) {
				throw new Error(t("admin.examScheduler.toast.error"));
			}
			await trpcClient.examScheduler.schedule.mutate({
				academicYearId,
				examTypeId,
				semesterId,
				percentage,
				dateStart: new Date(dateStart),
				dateEnd: new Date(dateEnd),
				classIds: Array.from(selectedClasses),
			});
		},
		onSuccess: () => {
			toast.success(t("admin.examScheduler.toast.success"));
			queryClient.invalidateQueries({
				queryKey: ["examSchedulerHistory"],
			});
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

	// Retake session mutation
	const scheduleRetakesMutation = useMutation({
		mutationFn: async () => {
			if (
				!academicYearId ||
				!semesterId ||
				!dateStart ||
				!dateEnd ||
				!selectedExams.size
			) {
				throw new Error(t("admin.examScheduler.toast.retakeError"));
			}
			return trpcClient.examScheduler.scheduleRetakes.mutate({
				academicYearId,
				semesterId,
				dateStart: new Date(dateStart),
				dateEnd: new Date(dateEnd),
				examIds: Array.from(selectedExams),
				scoringPolicy,
				examTypeId: examTypeFilter || undefined,
				classId: classFilter || undefined,
			});
		},
		onSuccess: (result) => {
			toast.success(
				t("admin.examScheduler.toast.retakeSuccess", {
					count: result.created,
				}),
			);
			queryClient.invalidateQueries({
				queryKey: ["examSchedulerHistory"],
			});
			queryClient.invalidateQueries({
				queryKey: ["examSchedulerRetakePreview"],
			});
			setIsScheduleOpen(false);
			resetForm();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examScheduler.toast.retakeError");
			toast.error(message);
		},
	});

	const canSubmitNormal =
		Boolean(
			academicYearId &&
				examTypeId &&
				semesterId &&
				dateStart &&
				dateEnd &&
				selectedClasses.size,
		) &&
		percentage >= 1 &&
		percentage <= 100 &&
		!scheduleMutation.isPending;

	const canSubmitRetake =
		Boolean(
			academicYearId &&
				semesterId &&
				dateStart &&
				dateEnd &&
				selectedExams.size,
		) && !scheduleRetakesMutation.isPending;

	const toggleClass = (id: string) => {
		setSelectedClasses((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleExam = (id: string) => {
		setSelectedExams((prev) => {
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

	const setAllExams = (checked: boolean) => {
		if (!retakeExamIds.length) return;
		setSelectedExams(checked ? new Set(retakeExamIds) : new Set());
	};

	const allClassesSelected =
		previewClassIds.length > 0 &&
		selectedClasses.size === previewClassIds.length;

	const allExamsSelected =
		retakeExamIds.length > 0 && selectedExams.size === retakeExamIds.length;

	const closeDetails = () => setDetailsRunId(null);

	const detailsData = runDetailsQuery.data as RunDetails | null;

	const handleSubmit = () => {
		if (sessionMode === "normal") {
			scheduleMutation.mutate();
		} else {
			scheduleRetakesMutation.mutate();
		}
	};

	const isPending =
		scheduleMutation.isPending || scheduleRetakesMutation.isPending;
	const canSubmit =
		sessionMode === "normal" ? canSubmitNormal : canSubmitRetake;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-foreground">
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
						<TableSkeleton columns={10} rows={8} />
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
				<DialogContent className="flex max-h-[90vh] w-[90vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]">
					{/* ── Header ── */}
					<div className="shrink-0 border-b px-6 py-4">
						<DialogHeader>
							<DialogTitle>{t("admin.examScheduler.form.title")}</DialogTitle>
							<p className="text-muted-foreground text-xs">
								{t("admin.examScheduler.form.description")}
							</p>
						</DialogHeader>
						<div className="mt-4 px-6 pb-4">
							<Tabs
								value={sessionMode}
								onValueChange={(v) => setSessionMode(v as SessionMode)}
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="normal" className="gap-2">
										<Play className="h-4 w-4" />
										{t("admin.examScheduler.sessionMode.normal")}
									</TabsTrigger>
									<TabsTrigger value="retake" className="gap-2">
										<RefreshCcw className="h-4 w-4" />
										{t("admin.examScheduler.sessionMode.retake")}
									</TabsTrigger>
								</TabsList>
							</Tabs>
							<p className="mt-1.5 text-muted-foreground text-xs">
								{sessionMode === "normal"
									? t("admin.examScheduler.sessionMode.normalDescription")
									: t("admin.examScheduler.sessionMode.retakeDescription")}
							</p>
						</div>
					</div>

					{/* ── Body ── */}
					<div className="grid min-h-0 flex-1 grid-cols-[1fr_3fr] overflow-hidden">
						{/* Left sidebar */}
						<div className="flex flex-col gap-5 overflow-y-auto border-r bg-muted/30 px-5 py-5">
							{/* Période */}
							<div className="space-y-3">
								<p className="font-medium text-foreground text-sm">
									{t("admin.examScheduler.form.periodSection", {
										defaultValue: "Période",
									})}
								</p>
								<div className="space-y-1.5">
									<Label className="text-xs">
										{t("admin.examScheduler.form.academicYearLabel")}
									</Label>
									<AcademicYearSelect
										value={academicYearId || null}
										onChange={setAcademicYearId}
										autoSelectActive
										placeholder={t(
											"admin.examScheduler.form.academicYearPlaceholder",
										)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs">
										{t("admin.examScheduler.form.semesterLabel")}
									</Label>
									<SemesterSelect
										value={semesterId || null}
										onChange={(v) => setSemesterId(v ?? "")}
										placeholder={t(
											"admin.examScheduler.form.semesterPlaceholder",
										)}
									/>
								</div>
							</div>

							<div className="h-px bg-border" />

							{/* Configuration */}
							<div className="space-y-3">
								<p className="font-medium text-foreground text-sm">
									{t("admin.examScheduler.form.configSection", {
										defaultValue: "Configuration",
									})}
								</p>

								{sessionMode === "normal" && (
									<>
										<div className="space-y-1.5">
											<Label className="text-xs">
												{t("admin.examScheduler.form.examTypeLabel")}
											</Label>
											<Select
												value={examTypeId}
												onValueChange={(value) => {
													setExamTypeId(value);
													const selectedType = examTypesQuery.data?.find(
														(t) => t.id === value,
													);
													if (selectedType?.defaultPercentage != null) {
														setPercentage(selectedType.defaultPercentage);
													}
												}}
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
										<div className="space-y-1.5">
											<Label className="text-xs">
												{t("admin.examScheduler.form.percentageLabel")}
											</Label>
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
									</>
								)}

								{sessionMode === "retake" && (
									<>
										<div className="space-y-1.5">
											<Label className="text-xs">
												{t("admin.examScheduler.form.scoringPolicyLabel")}
											</Label>
											<Select
												value={scoringPolicy}
												onValueChange={(v) =>
													setScoringPolicy(v as "replace" | "best_of")
												}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.examScheduler.form.scoringPolicyPlaceholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="replace">
														{t("admin.examScheduler.form.scoringPolicyReplace")}
													</SelectItem>
													<SelectItem value="best_of">
														{t("admin.examScheduler.form.scoringPolicyBestOf")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-xs">
												{t("admin.examScheduler.form.classFilterLabel")}
											</Label>
											<Select
												value={classFilter || "__all__"}
												onValueChange={(v) =>
													setClassFilter(v === "__all__" ? "" : v)
												}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.examScheduler.form.classFilterPlaceholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="__all__">
														{t(
															"admin.examScheduler.form.classFilterPlaceholder",
														)}
													</SelectItem>
													{classes.map((cls) => (
														<SelectItem key={cls.id} value={cls.id}>
															{cls.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-xs">
												{t("admin.examScheduler.form.examTypeFilterLabel")}
											</Label>
											<Select
												value={examTypeFilter || "__all__"}
												onValueChange={(v) =>
													setExamTypeFilter(v === "__all__" ? "" : v)
												}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.examScheduler.form.examTypeFilterPlaceholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="__all__">
														{t(
															"admin.examScheduler.form.examTypeFilterPlaceholder",
														)}
													</SelectItem>
													{(examTypesQuery.data ?? []).map((type) => (
														<SelectItem key={type.id} value={type.id}>
															{type.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</>
								)}
							</div>

							<div className="h-px bg-border" />

							{/* Plage de dates */}
							<div className="space-y-3">
								<p className="font-medium text-foreground text-sm">
									{t("admin.examScheduler.form.dateRangeSection", {
										defaultValue: "Plage de dates",
									})}
								</p>
								<div className="space-y-1.5">
									<Label className="text-xs">
										{t("admin.examScheduler.form.dateStartLabel")}
									</Label>
									<DatePicker value={dateStart} onChange={setDateStart} />
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs">
										{t("admin.examScheduler.form.dateEndLabel")}
									</Label>
									<DatePicker value={dateEnd} onChange={setDateEnd} />
								</div>
							</div>
						</div>

						{/* Right panel */}
						<div className="flex flex-col overflow-hidden">
							{sessionMode === "normal" && (
								<>
									<div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
										<div>
											<p className="font-medium text-sm">
												{t("admin.examScheduler.classes.title")}
											</p>
											<p className="text-muted-foreground text-xs">
												{t("admin.examScheduler.classes.description")}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Checkbox
												id="select-all-classes"
												checked={allClassesSelected}
												onCheckedChange={(value) =>
													setAllClasses(value === true)
												}
												disabled={!previewClasses.length}
											/>
											<Label htmlFor="select-all-classes" className="text-sm">
												{t("admin.examScheduler.classes.selectAll")}
											</Label>
										</div>
									</div>
									<div className="flex-1 overflow-y-auto p-4">
										{previewQuery.isLoading ? (
											<div className="flex h-full items-center justify-center">
												<Spinner />
											</div>
										) : !previewClasses.length ? (
											<div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
												{t("admin.examScheduler.classes.description")}
											</div>
										) : (
											<div className="space-y-2">
												{previewClasses.map((klass) => (
													<div
														key={klass.id}
														onClick={() => toggleClass(klass.id)}
														className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
															selectedClasses.has(klass.id)
																? "border-primary/40 bg-primary/5"
																: "border-border hover:bg-muted/50"
														}`}
													>
														<div className="min-w-0 flex-1">
															<p className="font-medium text-sm">
																{klass.name}
															</p>
															<p className="truncate text-muted-foreground text-xs">
																{klass.programName}
															</p>
														</div>
														<div className="ml-3 flex shrink-0 items-center gap-3">
															<Badge variant="outline" className="text-xs">
																{klass.classCourseCount}{" "}
																{t("admin.exams.table.course")}
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
								</>
							)}

							{sessionMode === "retake" && (
								<>
									<div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
										<div>
											<p className="font-medium text-sm">
												{t("admin.examScheduler.retakeExams.title")}
											</p>
											<p className="text-muted-foreground text-xs">
												{t("admin.examScheduler.retakeExams.description")}
											</p>
										</div>
										<div className="flex items-center gap-3">
											<Badge variant="secondary" className="text-xs">
												{t("admin.examScheduler.retakeExams.examCount", {
													count: retakeExams.length,
												})}
											</Badge>
											<div className="flex items-center gap-2">
												<Checkbox
													id="select-all-exams"
													checked={allExamsSelected}
													onCheckedChange={(value) =>
														setAllExams(value === true)
													}
													disabled={!retakeExams.length}
												/>
												<Label htmlFor="select-all-exams" className="text-sm">
													{t("admin.examScheduler.retakeExams.selectAll")}
												</Label>
											</div>
										</div>
									</div>
									<div className="flex-1 overflow-y-auto">
										{retakePreviewQuery.isLoading ? (
											<div className="flex h-full items-center justify-center">
												<Spinner />
											</div>
										) : !retakeExams.length ? (
											<div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
												{t("admin.examScheduler.retakeExams.noExams")}
											</div>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="w-12" />
														<TableHead>
															{t(
																"admin.examScheduler.history.details.table.exam",
															)}
														</TableHead>
														<TableHead>
															{t(
																"admin.examScheduler.history.details.table.course",
															)}
														</TableHead>
														<TableHead>
															{t(
																"admin.examScheduler.history.details.table.class",
															)}
														</TableHead>
														<TableHead>
															{t(
																"admin.examScheduler.history.details.table.type",
															)}
														</TableHead>
														<TableHead>
															{t(
																"admin.examScheduler.history.details.table.date",
															)}
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{retakeExams.map((exam) => (
														<TableRow key={exam.id}>
															<TableCell>
																<Checkbox
																	checked={selectedExams.has(exam.id)}
																	onCheckedChange={() => toggleExam(exam.id)}
																/>
															</TableCell>
															<TableCell className="font-medium">
																{exam.name}
															</TableCell>
															<TableCell>{exam.courseName}</TableCell>
															<TableCell>{exam.className}</TableCell>
															<TableCell>
																<Badge variant="outline">{exam.type}</Badge>
															</TableCell>
															<TableCell>
																{format(new Date(exam.date), "PP")}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										)}
									</div>
								</>
							)}
						</div>
					</div>

					{/* ── Footer ── */}
					<div className="flex shrink-0 items-center justify-between border-t bg-background px-6 py-3">
						<Button variant="ghost" type="button" onClick={resetForm}>
							{t("common.actions.reset")}
						</Button>
						<div className="flex items-center gap-3">
							{sessionMode === "normal" && selectedClasses.size > 0 && (
								<span className="text-muted-foreground text-xs">
									{selectedClasses.size}{" "}
									{t("admin.examScheduler.classes.title", {
										defaultValue: "classes",
									})}
								</span>
							)}
							{sessionMode === "retake" && selectedExams.size > 0 && (
								<span className="text-muted-foreground text-xs">
									{selectedExams.size}{" "}
									{t("admin.examScheduler.retakeExams.title", {
										defaultValue: "examens sélectionnés",
									})}
								</span>
							)}
							<Button onClick={handleSubmit} disabled={!canSubmit}>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								{sessionMode === "normal"
									? t("admin.examScheduler.actions.schedule")
									: t("admin.examScheduler.actions.scheduleRetakes")}
							</Button>
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
					<div className="px-6 pb-4">
					{runDetailsQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : !detailsData ? (
						<Empty>
						<EmptyHeader>
							<EmptyDescription>{t("admin.examScheduler.history.emptyDescription")}</EmptyDescription>
						</EmptyHeader>
					</Empty>
					) : (
						<div className="space-y-4">
							<div className="text-muted-foreground text-xs">
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
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
