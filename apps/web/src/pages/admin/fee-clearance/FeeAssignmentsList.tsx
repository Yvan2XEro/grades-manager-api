import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileUp,
	Loader2,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import BankImportDialog from "./BankImportDialog";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	unpaid: "destructive",
	partial: "outline",
	paid: "default",
	exempt: "secondary",
};

const statusIcons: Record<string, React.ReactNode> = {
	paid: <CheckCircle2 className="mr-1 h-3 w-3" />,
	partial: <Clock className="mr-1 h-3 w-3" />,
	unpaid: <XCircle className="mr-1 h-3 w-3" />,
	exempt: <CheckCircle2 className="mr-1 h-3 w-3" />,
};

const ALL_FILTER_VALUE = "__all__";

export default function FeeAssignmentsList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [yearFilter, setYearFilter] = useState("");
	const [classFilter, setClassFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [search, setSearch] = useState("");
	const [showBulkAssign, setShowBulkAssign] = useState(false);
	const [showBankImport, setShowBankImport] = useState(false);
	const [showAssignStudent, setShowAssignStudent] = useState(false);

	const { data: classes } = useQuery(
		trpc.classes.list.queryOptions(
			yearFilter ? { academicYearId: yearFilter } : {},
		),
	);

	const { data, isLoading } = useQuery(
		trpc.feeClearance.listAssignments.queryOptions({
			academicYearId: yearFilter || undefined,
			classId: classFilter || undefined,
			status: statusFilter ? [statusFilter] : undefined,
			search: search || undefined,
			limit: 200,
			offset: 0,
		}),
	);

	// Compute status counts from current result set
	const statusCounts = (data?.items ?? []).reduce(
		(acc, a) => {
			acc[a.status] = (acc[a.status] ?? 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const formatAmount = (amount: string | null, currency: string) =>
		amount ? `${Number(amount).toLocaleString()} ${currency}` : "—";

	const getStudentName = (assignment: {
		student?: {
			profile?: { firstName: string; lastName: string } | null;
		} | null;
	}) => {
		const p = assignment.student?.profile;
		return p ? `${p.firstName} ${p.lastName}` : "—";
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">
						{t("feeClearance.assignments.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.assignments.subtitle")}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setShowBankImport(true)}>
						<FileUp className="mr-2 h-4 w-4" />
						{t("feeClearance.bankImport.button")}
					</Button>
					<Button variant="outline" onClick={() => setShowAssignStudent(true)}>
						{t("feeClearance.assignments.assignStudentTitle")}
					</Button>
					<Button variant="outline" onClick={() => setShowBulkAssign(true)}>
						<Users className="mr-2 h-4 w-4" />
						{t("feeClearance.assignments.bulkAssign")}
					</Button>
				</div>
			</div>

			{/* Summary stats */}
			{data && (
				<div className="grid grid-cols-4 gap-3">
					{(["unpaid", "partial", "paid", "exempt"] as const).map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
							className={`rounded-lg border p-3 text-left transition-colors ${
								statusFilter === s
									? "border-primary bg-primary/5"
									: "hover:bg-muted/50"
							}`}
						>
							<div className="flex items-center gap-1">
								<Badge variant={statusVariants[s]}>
									{statusIcons[s]}
									{t(`feeClearance.assignments.status.${s}`)}
								</Badge>
							</div>
							<p className="mt-1 font-bold text-xl">{statusCounts[s] ?? 0}</p>
						</button>
					))}
				</div>
			)}

			{/* Filters */}
			<div className="flex flex-wrap gap-2">
				<div className="relative max-w-xs flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={t("common.search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<div>
					<label className="mb-1 block text-muted-foreground text-xs">
						{t("feeClearance.structures.fields.academicYear")}
					</label>
					<AcademicYearSelect
						value={yearFilter || null}
						onChange={(v) => {
							setYearFilter(v ?? "");
							setClassFilter("");
						}}
						allowAll
						autoSelectActive={false}
						className="w-48"
					/>
				</div>
				{classes && classes.length > 0 && (
					<Select
						value={classFilter || ALL_FILTER_VALUE}
						onValueChange={(v) =>
							setClassFilter(v === ALL_FILTER_VALUE ? "" : v)
						}
					>
						<SelectTrigger className="w-44">
							<SelectValue
								placeholder={t("feeClearance.assignments.fields.class")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>
								{t("common.all")}
							</SelectItem>
							{classes.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				<Select
					value={statusFilter || ALL_FILTER_VALUE}
					onValueChange={(v) =>
						setStatusFilter(v === ALL_FILTER_VALUE ? "" : v)
					}
				>
					<SelectTrigger className="w-36">
						<SelectValue
							placeholder={t("feeClearance.assignments.fields.status")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_FILTER_VALUE}>{t("common.all")}</SelectItem>
						{["unpaid", "partial", "paid", "exempt"].map((s) => (
							<SelectItem key={s} value={s}>
								{t(`feeClearance.assignments.status.${s}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<TableSkeleton columns={6} rows={5} />
			) : !data?.items?.length ? (
				<Empty>
					<EmptyMedia />
					<EmptyHeader>
						<EmptyTitle>{t("feeClearance.assignments.empty.title")}</EmptyTitle>
						<EmptyDescription>
							{t("feeClearance.assignments.empty.description")}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("feeClearance.assignments.fields.student")}
							</TableHead>
							<TableHead>
								{t("feeClearance.structures.fields.academicYear")}
							</TableHead>
							<TableHead>
								{t("feeClearance.assignments.fields.effectiveAmount")}
							</TableHead>
							<TableHead>
								{t("feeClearance.assignments.fields.status")}
							</TableHead>
							<TableHead>
								{t("feeClearance.assignments.fields.clearedAt")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.items.map((a) => (
							<TableRow
								key={a.id}
								className="cursor-pointer"
								onClick={() =>
									navigate(`/admin/fee-clearance/assignments/${a.id}`)
								}
							>
								<TableCell className="font-medium">
									{getStudentName(a)}
								</TableCell>
								<TableCell>{a.academicYear?.name ?? "—"}</TableCell>
								<TableCell>
									{formatAmount(a.effectiveAmount, a.currency)}
								</TableCell>
								<TableCell>
									<Badge variant={statusVariants[a.status]}>
										{statusIcons[a.status]}
										{t(`feeClearance.assignments.status.${a.status}`)}
									</Badge>
								</TableCell>
								<TableCell>
									{a.clearedAt
										? format(new Date(a.clearedAt), "dd/MM/yyyy")
										: "—"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{data && (
				<p className="text-muted-foreground text-sm">
					{data.items.length} / {data.total}
				</p>
			)}

			<BulkAssignDialog
				open={showBulkAssign}
				onOpenChange={setShowBulkAssign}
				onDone={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.listAssignments.queryKey(),
					});
					setShowBulkAssign(false);
				}}
			/>

			<BankImportDialog
				open={showBankImport}
				onOpenChange={setShowBankImport}
				onSuccess={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.listAssignments.queryKey(),
					});
				}}
			/>

			<AssignStudentDialog
				open={showAssignStudent}
				onOpenChange={setShowAssignStudent}
				onDone={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.listAssignments.queryKey(),
					});
					setShowAssignStudent(false);
				}}
			/>
		</div>
	);
}

type PreviewResult = RouterOutputs["feeClearance"]["previewBulkAssign"];

type BulkMode = "class" | "program" | "year" | "students";

function BulkAssignDialog({
	open,
	onOpenChange,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [mode, setMode] = useState<BulkMode>("class");
	const [yearId, setYearId] = useState("");
	const [structureId, setStructureId] = useState("");
	const [classId, setClassId] = useState("");
	const [programId, setProgramId] = useState("");
	const [studentIds, setStudentIds] = useState<string[]>([]);
	const [studentSearch, setStudentSearch] = useState("");
	const [showPreview, setShowPreview] = useState(false);

	const canPreview =
		!!structureId &&
		(mode === "class"
			? !!classId
			: mode === "program"
				? !!programId
				: mode === "students"
					? studentIds.length > 0
					: !!yearId);

	const { data: structures } = useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: yearId || undefined,
			isActive: true,
		}),
	);
	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));
	const { data: studentSearchResults } = useQuery({
		...trpc.students.list.queryOptions({
			q: studentSearch || undefined,
			limit: 20,
		}),
		enabled: mode === "students" && studentSearch.length >= 2,
	});

	// Preview queries per mode
	const previewClass = useQuery({
		...trpc.feeClearance.previewBulkAssign.queryOptions({
			classId,
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "class" && canPreview,
	});
	const previewProgram = useQuery({
		...trpc.feeClearance.previewBulkAssignProgram.queryOptions({
			programId,
			academicYearId: yearId,
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "program" && canPreview,
	});
	const previewYear = useQuery({
		...trpc.feeClearance.previewBulkAssignYear.queryOptions({
			academicYearId: yearId,
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "year" && canPreview,
	});
	const previewStudents = useQuery({
		...trpc.feeClearance.previewBulkAssignStudents.queryOptions({
			studentIds: studentIds.length > 0 ? studentIds : ["__placeholder__"],
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "students" && canPreview,
	});

	const activePreview =
		mode === "class"
			? previewClass.data
			: mode === "program"
				? previewProgram.data
				: mode === "students"
					? previewStudents.data
					: previewYear.data;
	const previewLoading =
		previewClass.isFetching ||
		previewProgram.isFetching ||
		previewYear.isFetching ||
		previewStudents.isFetching;

	const mut = useMutation({
		mutationFn: () => {
			if (mode === "class")
				return trpcClient.feeClearance.bulkAssignClass.mutate({
					classId,
					feeStructureId: structureId,
					skipExisting: true,
				});
			if (mode === "program")
				return trpcClient.feeClearance.bulkAssignProgram.mutate({
					programId,
					academicYearId: yearId,
					feeStructureId: structureId,
					skipExisting: true,
				});
			if (mode === "students")
				return trpcClient.feeClearance.bulkAssignStudents.mutate({
					studentIds,
					feeStructureId: structureId,
					skipExisting: true,
				});
			return trpcClient.feeClearance.bulkAssignYear.mutate({
				academicYearId: yearId,
				feeStructureId: structureId,
				skipExisting: true,
			});
		},
		onSuccess: (result) => {
			toast.success(
				t("feeClearance.assignments.bulkAssignSuccess", {
					assigned: result.assigned,
					skipped: result.skipped,
				}),
			);
			onDone();
		},
	});

	function reset() {
		setShowPreview(false);
		setStructureId("");
		setClassId("");
		setProgramId("");
		setStudentIds([]);
		setStudentSearch("");
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("feeClearance.assignments.bulkAssign")}</DialogTitle>
				</DialogHeader>

				<DialogBody className="space-y-4">
					{/* Mode selector */}
					<div>
						<Label>{t("feeClearance.bulkAssign.mode")}</Label>
						<Select
							value={mode}
							onValueChange={(v) => {
								setMode(v as BulkMode);
								reset();
							}}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="class">
									{t("feeClearance.bulkAssign.modeClass")}
								</SelectItem>
								<SelectItem value="program">
									{t("feeClearance.bulkAssign.modeProgram")}
								</SelectItem>
								<SelectItem value="year">
									{t("feeClearance.bulkAssign.modeYear")}
								</SelectItem>
								<SelectItem value="students">
									{t("feeClearance.assignments.bulkAssignModeStudents")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Year selector (all modes except students) */}
					{mode !== "students" && (
						<div>
							<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
							<AcademicYearSelect
								value={yearId || null}
								onChange={(v) => {
									setYearId(v);
									reset();
								}}
								autoSelectActive
							/>
						</div>
					)}

					{/* Mode-specific scope selector */}
					{mode === "class" && (
						<div>
							<Label>{t("admin.classes.title")}</Label>
							<ClassSelect
								academicYearId={yearId || null}
								value={classId || null}
								onChange={(v) => {
									setClassId(v ?? "");
									setShowPreview(false);
								}}
								disabled={!yearId}
							/>
						</div>
					)}
					{mode === "program" && (
						<div>
							<Label>{t("feeClearance.bulkAssign.program")}</Label>
							<Select
								value={programId}
								onValueChange={(v) => {
									setProgramId(v);
									setShowPreview(false);
								}}
							>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{programs?.items?.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{mode === "students" && (
						<div className="space-y-2">
							<Label>{t("feeClearance.assignments.assignStudentTitle")}</Label>
							<Input
								placeholder={t("common.search")}
								value={studentSearch}
								onChange={(e) => {
									setStudentSearch(e.target.value);
									setShowPreview(false);
								}}
							/>
							{studentSearchResults?.items &&
								studentSearchResults.items.length > 0 && (
									<div className="max-h-40 overflow-y-auto rounded border text-sm">
										{studentSearchResults.items.map((s) => {
											const name =
												`${s.profile?.firstName ?? ""} ${s.profile?.lastName ?? ""}`.trim();
											const checked = studentIds.includes(s.id);
											return (
												<label
													key={s.id}
													className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-muted/50"
												>
													<input
														type="checkbox"
														className="h-4 w-4 rounded border"
														checked={checked}
														onChange={(e) => {
															setStudentIds((ids) =>
																e.target.checked
																	? [...ids, s.id]
																	: ids.filter((x) => x !== s.id),
															);
															setShowPreview(false);
														}}
													/>
													<span>{name || s.registrationNumber}</span>
												</label>
											);
										})}
									</div>
								)}
							{studentIds.length > 0 && (
								<p className="text-muted-foreground text-xs">
									{studentIds.length}{" "}
									{t("feeClearance.assignments.fields.student")}(s)
									sélectionné(s)
								</p>
							)}
						</div>
					)}

					{/* Structure selector */}
					<div>
						<Label>{t("feeClearance.assignments.fields.structure")}</Label>
						<Select
							value={structureId}
							onValueChange={(v) => {
								setStructureId(v);
								setShowPreview(false);
							}}
							disabled={!yearId}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{structures?.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Preview panel */}
					{showPreview && (
						<div className="rounded-lg border bg-muted/30 p-3">
							{previewLoading ? (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Loader2 className="h-4 w-4 animate-spin" />
									{t("feeClearance.bulkAssign.computing")}
								</div>
							) : activePreview ? (
								<PreviewPanel preview={activePreview} />
							) : null}
						</div>
					)}
				</DialogBody>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					{!showPreview ? (
						<Button disabled={!canPreview} onClick={() => setShowPreview(true)}>
							{t("feeClearance.bulkAssign.preview")}
						</Button>
					) : (
						<Button
							disabled={
								mut.isPending ||
								previewLoading ||
								!activePreview ||
								activePreview.toAssign.length === 0
							}
							onClick={() => mut.mutate()}
						>
							{mut.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("feeClearance.bulkAssign.confirm", {
								count: activePreview?.toAssign.length ?? 0,
							})}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function PreviewPanel({ preview }: { preview: PreviewResult }) {
	const hasNew = preview.toAssign.length > 0;
	const hasSkipped = preview.alreadyAssignedCount > 0;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-4 text-sm">
				<span className="flex items-center gap-1 text-emerald-700">
					<CheckCircle2 className="h-3.5 w-3.5" />
					<strong>{preview.toAssign.length}</strong> à assigner
				</span>
				{hasSkipped && (
					<span className="flex items-center gap-1 text-muted-foreground">
						<AlertCircle className="h-3.5 w-3.5" />
						{preview.alreadyAssignedCount} déjà assigné(s) — ignoré(s)
					</span>
				)}
			</div>

			{hasNew && (
				<div className="max-h-48 overflow-y-auto rounded border bg-background">
					<table className="w-full text-xs">
						<thead className="sticky top-0 bg-muted/80">
							<tr>
								<th className="px-2 py-1.5 text-left font-medium">Étudiant</th>
								<th className="px-2 py-1.5 text-left font-medium">Matricule</th>
								<th className="px-2 py-1.5 text-right font-medium">Montant</th>
							</tr>
						</thead>
						<tbody>
							{preview.toAssign.map((s) => (
								<tr key={s.studentId} className="border-t">
									<td className="px-2 py-1">
										{s.firstName} {s.lastName}
									</td>
									<td className="px-2 py-1 text-muted-foreground">
										{s.registrationNumber}
									</td>
									<td className="px-2 py-1 text-right tabular-nums">
										{Number(s.amount).toLocaleString()} {s.currency}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{!hasNew && (
				<p className="text-muted-foreground text-sm">
					Tous les étudiants ont déjà une assignation pour cette année.
				</p>
			)}
		</div>
	);
}

function AssignStudentDialog({
	open,
	onOpenChange,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [structureId, setStructureId] = useState("");
	const [studentSearch, setStudentSearch] = useState("");
	const [studentId, setStudentId] = useState("");
	const [discountAmount, setDiscountAmount] = useState("0");
	const [discountReason, setDiscountReason] = useState("");
	const [notes, setNotes] = useState("");

	const { data: structures } = useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: yearId || undefined,
			isActive: true,
		}),
	);
	const { data: studentResults } = useQuery({
		...trpc.students.list.queryOptions({
			q: studentSearch || undefined,
			limit: 15,
		}),
		enabled: studentSearch.length >= 2,
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.assignStudent.mutate({
				studentId,
				academicYearId: yearId,
				feeStructureId: structureId,
				discountAmount: Number(discountAmount) || 0,
				discountReason: discountReason || undefined,
				notes: notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onDone();
			setStudentId("");
			setStudentSearch("");
			setStructureId("");
			setDiscountAmount("0");
			setDiscountReason("");
			setNotes("");
		},
		onError: (e) => toast.error(e.message),
	});

	const selectedStudent = studentResults?.items?.find(
		(s) => s.id === studentId,
	);
	const selectedName = selectedStudent
		? `${selectedStudent.profile?.firstName ?? ""} ${selectedStudent.profile?.lastName ?? ""}`.trim()
		: "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.assignments.assignStudentTitle")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
						<AcademicYearSelect
							value={yearId || null}
							onChange={(v) => {
								setYearId(v);
								setStructureId("");
							}}
							autoSelectActive
						/>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.fields.structure")}</Label>
						<Select
							value={structureId}
							onValueChange={setStructureId}
							disabled={!yearId}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{structures?.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>{t("feeClearance.assignments.fields.student")}</Label>
						{studentId && selectedName && (
							<p className="rounded bg-muted px-2 py-1 text-sm">
								{selectedName}
								<button
									type="button"
									className="ml-2 text-muted-foreground hover:text-destructive"
									onClick={() => {
										setStudentId("");
										setStudentSearch("");
									}}
								>
									&#x2715;
								</button>
							</p>
						)}
						{!studentId && (
							<>
								<Input
									placeholder={t("common.search")}
									value={studentSearch}
									onChange={(e) => setStudentSearch(e.target.value)}
								/>
								{studentResults?.items && studentResults.items.length > 0 && (
									<div className="max-h-40 overflow-y-auto rounded border text-sm">
										{studentResults.items.map((s) => {
											const name =
												`${s.profile?.firstName ?? ""} ${s.profile?.lastName ?? ""}`.trim();
											return (
												<button
													key={s.id}
													type="button"
													className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50"
													onClick={() => {
														setStudentId(s.id);
														setStudentSearch(name || s.registrationNumber);
													}}
												>
													<span>{name || s.registrationNumber}</span>
													<span className="ml-auto text-muted-foreground">
														{s.registrationNumber}
													</span>
												</button>
											);
										})}
									</div>
								)}
							</>
						)}
					</div>
					<div>
						<Label>{t("feeClearance.assignments.discountLabel")}</Label>
						<Input
							type="number"
							min={0}
							value={discountAmount}
							onChange={(e) => setDiscountAmount(e.target.value)}
						/>
					</div>
					{Number(discountAmount) > 0 && (
						<div>
							<Label>{t("feeClearance.assignments.discountReasonLabel")}</Label>
							<Input
								value={discountReason}
								placeholder={t("common.optional")}
								onChange={(e) => setDiscountReason(e.target.value)}
							/>
						</div>
					)}
					<div>
						<Label>{t("feeClearance.bankImport.notes")}</Label>
						<Input
							value={notes}
							placeholder={t("common.optional")}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!studentId || !yearId || !structureId || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("feeClearance.assignments.assignStudentSubmit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
