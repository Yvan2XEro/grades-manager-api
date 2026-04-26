import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertTriangle,
	Ban,
	CheckCircle,
	RefreshCw,
	Search,
	Shield,
	ShieldOff,
	UserCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ContextMenuItem } from "@/components/ui/context-menu";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

type RetakeEligibilityReason =
	| "NO_GRADE"
	| "FAILED_EXAM"
	| "PASSED_EXAM"
	| "ATTEMPT_LIMIT_REACHED"
	| "OVERRIDE_FORCE_ELIGIBLE"
	| "OVERRIDE_FORCE_INELIGIBLE";

interface EligibilityRow {
	studentCourseEnrollmentId: string;
	studentId: string;
	registrationNumber: string;
	studentName: string;
	attempt: number;
	grade: number | null;
	status: "eligible" | "ineligible";
	reasons: RetakeEligibilityReason[];
	override?: {
		id: string;
		decision: "force_eligible" | "force_ineligible";
		reason: string;
	};
}

interface OverrideModalState {
	isOpen: boolean;
	row: EligibilityRow | null;
	action: "force_eligible" | "force_ineligible" | null;
}

export default function RetakeEligibility() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);

	const { data: semestersData } = useQuery(
		trpc.semesters.list.queryOptions({}),
	);
	const filterUeSemester = useMemo(() => {
		if (!filterSemester || !semestersData) return undefined;
		const code =
			semestersData.items.find((s) => s.id === filterSemester)?.code ?? "";
		if (code === "S1") return "fall" as const;
		if (code === "S2") return "spring" as const;
		return "annual" as const;
	}, [filterSemester, semestersData]);
	const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
	const [overrideModal, setOverrideModal] = useState<OverrideModalState>({
		isOpen: false,
		row: null,
		action: null,
	});
	const [overrideReason, setOverrideReason] = useState("");
	const [search, setSearch] = useState("");

	// Fetch approved exams for the selected academic year
	const examsQuery = useQuery({
		...trpc.exams.list.queryOptions({
			academicYearId: academicYearId ?? undefined,
			...(filterUeSemester ? { ueSemester: filterUeSemester } : {}),
			limit: 100,
		}),
		enabled: Boolean(academicYearId),
		select: (data) => data.items.filter((exam) => exam.status === "approved"),
	});

	// Fetch eligibility data for the selected exam
	const eligibilityQuery = useQuery({
		queryKey: ["retakeEligibility", selectedExamId],
		queryFn: async () => {
			if (!selectedExamId) return null;
			return trpcClient.exams.listRetakeEligibility.query({
				examId: selectedExamId,
			});
		},
		enabled: Boolean(selectedExamId),
	});

	const upsertOverrideMutation = useMutation({
		mutationFn: async (input: {
			examId: string;
			studentCourseEnrollmentId: string;
			decision: "force_eligible" | "force_ineligible";
			reason: string;
		}) => {
			return trpcClient.exams.upsertRetakeOverride.mutate(input);
		},
		onSuccess: () => {
			toast.success(t("admin.retake.toast.overrideSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["retakeEligibility", selectedExamId],
			});
			closeOverrideModal();
		},
		onError: (error: Error) => {
			toast.error(error.message || t("admin.retake.toast.overrideError"));
		},
	});

	const deleteOverrideMutation = useMutation({
		mutationFn: async (input: {
			examId: string;
			studentCourseEnrollmentId: string;
		}) => {
			return trpcClient.exams.deleteRetakeOverride.mutate(input);
		},
		onSuccess: () => {
			toast.success(t("admin.retake.toast.removeSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["retakeEligibility", selectedExamId],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message || t("admin.retake.toast.removeError"));
		},
	});

	const closeOverrideModal = () => {
		setOverrideModal({ isOpen: false, row: null, action: null });
		setOverrideReason("");
	};

	const handleOverrideSubmit = () => {
		if (
			!overrideModal.row ||
			!overrideModal.action ||
			!selectedExamId ||
			!overrideReason.trim()
		) {
			return;
		}
		upsertOverrideMutation.mutate({
			examId: selectedExamId,
			studentCourseEnrollmentId: overrideModal.row.studentCourseEnrollmentId,
			decision: overrideModal.action,
			reason: overrideReason.trim(),
		});
	};

	const handleRemoveOverride = (row: EligibilityRow) => {
		if (!selectedExamId) return;
		deleteOverrideMutation.mutate({
			examId: selectedExamId,
			studentCourseEnrollmentId: row.studentCourseEnrollmentId,
		});
	};

	const eligibilityData = eligibilityQuery.data;
	const isFeatureEnabled = eligibilityData?.enabled ?? false;
	const items = (eligibilityData?.items ?? []) as EligibilityRow[];

	const needle = search.trim().toLowerCase();
	const matchesSearch = (r: EligibilityRow) =>
		!needle ||
		r.studentName.toLowerCase().includes(needle) ||
		r.registrationNumber.toLowerCase().includes(needle);

	const eligibleStudents = items.filter(
		(r) => r.status === "eligible" && matchesSearch(r),
	);
	const ineligibleStudents = items.filter(
		(r) => r.status === "ineligible" && matchesSearch(r),
	);

	const selectedExam = examsQuery.data?.find((e) => e.id === selectedExamId);

	const renderReasonBadge = (reason: RetakeEligibilityReason) => {
		const reasonConfig: Record<
			RetakeEligibilityReason,
			{
				variant: "default" | "secondary" | "destructive" | "outline";
				icon: React.ReactNode;
			}
		> = {
			NO_GRADE: {
				variant: "secondary",
				icon: <AlertTriangle className="h-3 w-3" />,
			},
			FAILED_EXAM: {
				variant: "destructive",
				icon: <XCircle className="h-3 w-3" />,
			},
			PASSED_EXAM: {
				variant: "default",
				icon: <CheckCircle className="h-3 w-3" />,
			},
			ATTEMPT_LIMIT_REACHED: {
				variant: "destructive",
				icon: <Ban className="h-3 w-3" />,
			},
			OVERRIDE_FORCE_ELIGIBLE: {
				variant: "default",
				icon: <Shield className="h-3 w-3" />,
			},
			OVERRIDE_FORCE_INELIGIBLE: {
				variant: "destructive",
				icon: <ShieldOff className="h-3 w-3" />,
			},
		};
		const config = reasonConfig[reason];
		return (
			<Badge key={reason} variant={config.variant} className="gap-1 text-xs">
				{config.icon}
				{t(`admin.retake.reasons.${reason}`)}
			</Badge>
		);
	};

	const renderStudentTable = (
		students: EligibilityRow[],
		showEligibleActions: boolean,
	) =>
		eligibilityQuery.isLoading ? (
			<TableSkeleton columns={6} rows={8} />
		) : (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("admin.retake.table.student")}</TableHead>
						<TableHead>{t("admin.retake.table.registrationNumber")}</TableHead>
						<TableHead className="text-center">
							{t("admin.retake.table.attempt")}
						</TableHead>
						<TableHead className="text-center">
							{t("admin.retake.table.grade")}
						</TableHead>
						<TableHead>{t("admin.retake.table.reasons")}</TableHead>
						<TableHead className="text-right">
							{t("admin.retake.table.override")}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{students.map((row) => (
						<TableRow
							key={row.studentCourseEnrollmentId}
							actions={
								row.override ? (
									<ContextMenuItem onSelect={() => handleRemoveOverride(row)}>
										{t("admin.retake.override.remove")}
									</ContextMenuItem>
								) : (
									<>
										{showEligibleActions && (
											<ContextMenuItem
												onSelect={() =>
													setOverrideModal({
														isOpen: true,
														type: "eligible",
														row,
													})
												}
											>
												{t("admin.retake.override.forceEligible", {
													defaultValue: "Force eligible",
												})}
											</ContextMenuItem>
										)}
										<ContextMenuItem
											className="text-destructive"
											onSelect={() =>
												setOverrideModal({
													isOpen: true,
													type: "ineligible",
													row,
												})
											}
										>
											{t("admin.retake.override.forceIneligible", {
												defaultValue: "Force ineligible",
											})}
										</ContextMenuItem>
									</>
								)
							}
						>
							<TableCell className="font-medium">{row.studentName}</TableCell>
							<TableCell>{row.registrationNumber}</TableCell>
							<TableCell className="text-center">{row.attempt}</TableCell>
							<TableCell className="text-center">
								{row.grade !== null ? (
									<span
										className={
											row.grade < 10
												? "font-medium text-destructive"
												: "font-medium text-green-600"
										}
									>
										{row.grade.toFixed(2)}
									</span>
								) : (
									<span className="text-muted-foreground">—</span>
								)}
							</TableCell>
							<TableCell>
								<div className="flex flex-wrap gap-1">
									{row.reasons.map(renderReasonBadge)}
								</div>
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									{row.override ? (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveOverride(row)}
											disabled={deleteOverrideMutation.isPending}
										>
											<RefreshCw className="mr-1 h-4 w-4" />
											{t("admin.retake.override.remove")}
										</Button>
									) : showEligibleActions ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setOverrideModal({
													isOpen: true,
													row,
													action: "force_ineligible",
												})
											}
										>
											<ShieldOff className="mr-1 h-4 w-4" />
											{t("admin.retake.override.forceIneligible")}
										</Button>
									) : (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setOverrideModal({
													isOpen: true,
													row,
													action: "force_eligible",
												})
											}
										>
											<Shield className="mr-1 h-4 w-4" />
											{t("admin.retake.override.forceEligible")}
										</Button>
									)}
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-foreground">{t("admin.retake.title")}</h1>
				<p className="text-muted-foreground">{t("admin.retake.subtitle")}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.retake.selectExam")}</CardTitle>
					<CardDescription>
						{t("admin.retake.selectExamPlaceholder")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4">
						<div className="flex flex-col gap-2">
							<Label>{t("admin.exams.filters.academicYear")}</Label>
							<AcademicYearSelect
								value={academicYearId}
								onChange={(value) => {
									setAcademicYearId(value);
									setSelectedExamId(null);
								}}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>
								{t("admin.classes.filters.semester", {
									defaultValue: "Semester",
								})}
							</Label>
							<SemesterSelect
								value={filterSemester}
								onChange={(v) => {
									setFilterSemester(v);
									setSelectedExamId(null);
								}}
							/>
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<Label>{t("admin.retake.selectExam")}</Label>
							<Select
								value={selectedExamId ?? ""}
								onValueChange={setSelectedExamId}
								disabled={!academicYearId || examsQuery.isLoading}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admin.retake.selectExamPlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent>
									{examsQuery.data?.map((exam) => (
										<SelectItem key={exam.id} value={exam.id}>
											{exam.name} - {exam.className ?? ""} (
											{format(new Date(exam.date), "MMM d, yyyy")})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{selectedExamId && eligibilityQuery.isLoading && (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8" />
				</div>
			)}

			{selectedExamId && !eligibilityQuery.isLoading && !isFeatureEnabled && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>{t("admin.retake.featureDisabled")}</AlertTitle>
					<AlertDescription>
						{t("admin.retake.featureDisabled")}
					</AlertDescription>
				</Alert>
			)}

			{selectedExamId && !eligibilityQuery.isLoading && isFeatureEnabled && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>{selectedExam?.name}</CardTitle>
								<CardDescription>
									{selectedExam?.className} • {selectedExam?.courseName}
								</CardDescription>
							</div>
							<div className="flex gap-4">
								<div className="flex items-center gap-2">
									<UserCheck className="h-5 w-5 text-green-600" />
									<span className="font-medium">
										{t("admin.retake.eligibleCount", {
											count: eligibleStudents.length,
										})}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Users className="h-5 w-5 text-muted-foreground" />
									<span className="font-medium">
										{t("admin.retake.ineligibleCount", {
											count: ineligibleStudents.length,
										})}
									</span>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{items.length === 0 ? (
							<Empty className="border border-dashed">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Users className="h-8 w-8 text-muted-foreground" />
									</EmptyMedia>
									<EmptyTitle>{t("admin.retake.empty.title")}</EmptyTitle>
									<EmptyDescription>
										{t("admin.retake.empty.description")}
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent />
							</Empty>
						) : (
							<Tabs defaultValue="eligible">
								<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<TabsList>
										<TabsTrigger value="eligible" className="gap-2">
											<CheckCircle className="h-4 w-4" />
											{t("admin.retake.eligible")} ({eligibleStudents.length})
										</TabsTrigger>
										<TabsTrigger value="ineligible" className="gap-2">
											<XCircle className="h-4 w-4" />
											{t("admin.retake.ineligible")} (
											{ineligibleStudents.length})
										</TabsTrigger>
									</TabsList>
									<div className="relative w-full sm:w-64">
										<Search className="-translate-y-1/2 absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
										<Input
											placeholder="Nom ou n° d’inscription…"
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											className="h-8 pl-8 text-sm"
										/>
									</div>
								</div>
								<TabsContent value="eligible">
									{eligibleStudents.length > 0 ? (
										renderStudentTable(eligibleStudents, true)
									) : (
										<p className="py-6 text-center text-muted-foreground text-sm">
											{t("admin.retake.empty.title")}
										</p>
									)}
								</TabsContent>
								<TabsContent value="ineligible">
									{ineligibleStudents.length > 0 ? (
										renderStudentTable(ineligibleStudents, false)
									) : (
										<p className="py-6 text-center text-muted-foreground text-sm">
											{t("admin.retake.empty.title")}
										</p>
									)}
								</TabsContent>
							</Tabs>
						)}
					</CardContent>
				</Card>
			)}

			{/* Override Modal */}
			<Dialog
				open={overrideModal.isOpen}
				onOpenChange={(open) => !open && closeOverrideModal()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("admin.retake.override.confirmTitle")}</DialogTitle>
						<DialogDescription>
							{t("admin.retake.override.confirmMessage", {
								action:
									overrideModal.action === "force_eligible"
										? t("admin.retake.override.forceEligible").toLowerCase()
										: t("admin.retake.override.forceIneligible").toLowerCase(),
							})}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 px-6 py-4">
						<div className="space-y-2">
							<Label>{t("admin.retake.table.student")}</Label>
							<p className="font-medium">{overrideModal.row?.studentName}</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="overrideReason">
								{t("admin.retake.override.reason")}
							</Label>
							<Input
								id="overrideReason"
								value={overrideReason}
								onChange={(e) => setOverrideReason(e.target.value)}
								placeholder={t("admin.retake.override.reasonPlaceholder")}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={closeOverrideModal}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={handleOverrideSubmit}
							disabled={
								!overrideReason.trim() || upsertOverrideMutation.isPending
							}
						>
							{upsertOverrideMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : null}
							{t("common.actions.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
