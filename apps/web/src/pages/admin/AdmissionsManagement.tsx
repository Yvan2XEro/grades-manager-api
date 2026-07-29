import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2,
	ExternalLink,
	FileCheck2,
	GraduationCap,
	Search,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

type ApplicationDetail = RouterOutputs["admissions"]["get"];
type Checklist = RouterOutputs["admissions"]["getChecklist"];

const ALL = "__all__";
const PAGE_SIZE = 25;

const STATUS_COLORS: Record<string, string> = {
	submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
	under_review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
	waitlisted: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

function StatusBadge({ status }: { status: string }) {
	const { t } = useTranslation();
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}
		>
			{t(`admissions.statuses.${status}`)}
		</span>
	);
}

export default function AdmissionsManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// ── Filters ──────────────────────────────────────────────────────────────
	const [searchInput, setSearchInput] = useState("");
	const search = useDebounce(searchInput, 300);
	const [statusFilter, setStatusFilter] = useState(ALL);
	const [programFilter, setProgramFilter] = useState(ALL);
	const [yearFilter, setYearFilter] = useState<string | null>(null);
	const [page, setPage] = useState(0);

	// Initialize year filter to the active academic year on first load
	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	const [yearInitialized, setYearInitialized] = useState(false);
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
		if (!yearInitialized && active) {
			setYearFilter(active);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	// Reset page when filters change
	useEffect(() => {
		setPage(0);
	}, [search, statusFilter, programFilter, yearFilter]);

	// ── Selected application (drawer) ─────────────────────────────────────────
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [decisionNotes, setDecisionNotes] = useState("");
	const [registrationNumber, setRegistrationNumber] = useState("");
	const [targetClassId, setTargetClassId] = useState<string>("");

	// ── Queries ───────────────────────────────────────────────────────────────
	const listQuery = useQuery(
		trpc.admissions.list.queryOptions({
			search: search || undefined,
			status: statusFilter === ALL ? undefined : (statusFilter as never),
			programId: programFilter === ALL ? undefined : programFilter,
			academicYearId: yearFilter ?? undefined,
			limit: PAGE_SIZE,
			offset: page * PAGE_SIZE,
		}),
	);

	const detailQuery = useQuery(
		trpc.admissions.get.queryOptions(
			{ id: selectedId ?? "" },
			{ enabled: !!selectedId },
		),
	);
	const checklistQuery = useQuery(
		trpc.admissions.getChecklist.queryOptions(
			{ applicationId: selectedId ?? "" },
			{ enabled: !!selectedId },
		),
	);
	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());

	const programs = optionsQuery.data?.programs ?? [];

	const selected = detailQuery.data;
	const classes = (optionsQuery.data?.classes ?? []).filter((k) =>
		selected
			? k.program === selected.programId &&
				k.academicYear === selected.academicYearId
			: true,
	);

	const rows = listQuery.data?.rows ?? [];
	const total = listQuery.data?.total ?? 0;
	const pageCount = Math.ceil(total / PAGE_SIZE);

	// ── Mutations ─────────────────────────────────────────────────────────────
	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.list.queryKey(),
		});
		if (selectedId) {
			queryClient.invalidateQueries({
				queryKey: trpc.admissions.get.queryKey({ id: selectedId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.admissions.getChecklist.queryKey({
					applicationId: selectedId,
				}),
			});
		}
	};

	const setUnderReview = useMutation({
		mutationFn: (id: string) =>
			trpcClient.admissions.setUnderReview.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.updated"));
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const reviewApplication = useMutation({
		mutationFn: (input: {
			id: string;
			status: "accepted" | "rejected" | "waitlisted";
			reviewNotes?: string;
		}) => trpcClient.admissions.review.mutate(input),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.reviewed"));
			setDecisionNotes("");
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const reviewDocument = useMutation({
		mutationFn: (input: { id: string; status: "valid" | "invalid" }) =>
			trpcClient.admissions.reviewDocument.mutate(input),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.documentReviewed"));
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const convertApplication = useMutation({
		mutationFn: (id: string) =>
			trpcClient.admissions.convert.mutate({
				id,
				classId: targetClassId || undefined,
				registrationNumber: registrationNumber.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.converted"));
			setRegistrationNumber("");
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const openDrawer = (id: string) => {
		setSelectedId(id);
		setDecisionNotes("");
		setRegistrationNumber("");
		setTargetClassId("");
	};

	return (
		<div className="space-y-5">
			{/* Header */}
			<div>
				<h1 className="font-semibold text-2xl">
					{t("admissions.admin.title")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("admissions.admin.subtitle")}
				</p>
			</div>

			{/* Filter bar */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="relative min-w-[200px] flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={t("admissions.admin.searchPlaceholder")}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder={t("admissions.admin.allStatuses")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>
							{t("admissions.admin.allStatuses")}
						</SelectItem>
						{[
							"submitted",
							"under_review",
							"accepted",
							"waitlisted",
							"rejected",
						].map((s) => (
							<SelectItem key={s} value={s}>
								{t(`admissions.statuses.${s}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={programFilter} onValueChange={setProgramFilter}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder={t("admissions.fields.program")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>
							{t("admissions.admin.allPrograms")}
						</SelectItem>
						{programs.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<AcademicYearSelect
					value={yearFilter}
					onChange={(v) => setYearFilter(v)}
					autoSelectActive={false}
					allowAll
					allLabel={t("admissions.admin.allYears")}
					className="w-44"
				/>
				{(search ||
					statusFilter !== ALL ||
					programFilter !== ALL ||
					yearFilter !== null) && (
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-muted-foreground"
						onClick={() => {
							setSearchInput("");
							setStatusFilter(ALL);
							setProgramFilter(ALL);
							setYearFilter(null);
						}}
					>
						<XCircle className="size-4" />
						{t("common.clearFilters")}
					</Button>
				)}
			</div>

			{/* Table */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admissions.admin.cols.reference")}</TableHead>
							<TableHead>{t("admissions.admin.cols.name")}</TableHead>
							<TableHead className="hidden md:table-cell">
								{t("admissions.fields.email")}
							</TableHead>
							<TableHead className="hidden lg:table-cell">
								{t("admissions.fields.program")}
							</TableHead>
							<TableHead className="hidden lg:table-cell">
								{t("admissions.fields.academicYear")}
							</TableHead>
							<TableHead>{t("admissions.admin.cols.status")}</TableHead>
							<TableHead className="hidden xl:table-cell">
								{t("admissions.admin.cols.date")}
							</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{listQuery.isLoading && (
							<TableRow>
								<TableCell colSpan={8} className="py-12 text-center">
									<Spinner className="mx-auto" />
								</TableCell>
							</TableRow>
						)}
						{!listQuery.isLoading && rows.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={8}
									className="py-12 text-center text-muted-foreground"
								>
									{t("admissions.admin.empty")}
								</TableCell>
							</TableRow>
						)}
						{rows.map((app) => (
							<TableRow
								key={app.id}
								className="group cursor-pointer"
								onClick={() => openDrawer(app.id)}
							>
								<TableCell className="font-mono text-muted-foreground text-xs">
									{app.applicant.referenceCode}
								</TableCell>
								<TableCell>
									<div className="font-medium">
										{app.applicant.lastName} {app.applicant.firstName}
									</div>
									<div className="text-muted-foreground text-xs md:hidden">
										{app.applicant.email}
									</div>
								</TableCell>
								<TableCell className="hidden text-muted-foreground text-sm md:table-cell">
									{app.applicant.email}
								</TableCell>
								<TableCell className="hidden text-sm lg:table-cell">
									{app.program.name}
								</TableCell>
								<TableCell className="hidden text-sm lg:table-cell">
									{app.academicYear.name}
								</TableCell>
								<TableCell>
									<StatusBadge status={app.status} />
								</TableCell>
								<TableCell className="hidden text-muted-foreground text-xs xl:table-cell">
									{app.submittedAt
										? new Date(app.submittedAt).toLocaleDateString("fr-FR")
										: "—"}
								</TableCell>
								<TableCell className="w-10 pr-2">
									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
										title={t("admissions.admin.fullDossier")}
										asChild
										onClick={(e) => e.stopPropagation()}
									>
										<Link to={`/admin/admissions/${app.id}`}>
											<ExternalLink className="size-4" />
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{pageCount > 1 && (
					<div className="border-t p-3">
						<TablePagination
							page={page + 1}
							pageCount={pageCount}
							total={total}
							pageSize={PAGE_SIZE}
							onPageChange={(p) => setPage(p - 1)}
						/>
					</div>
				)}
			</Card>

			{/* Count */}
			{!listQuery.isLoading && (
				<p className="text-muted-foreground text-xs">
					{total} {total === 1 ? "candidature" : "candidatures"}
					{search ||
					statusFilter !== ALL ||
					programFilter !== ALL ||
					yearFilter !== null
						? " correspondant aux filtres"
						: " au total"}
				</p>
			)}

			{/* Detail drawer */}
			<Sheet
				open={!!selectedId}
				onOpenChange={(open) => {
					if (!open) setSelectedId(null);
				}}
			>
				<SheetContent
					className="w-full overflow-y-auto sm:max-w-2xl"
					side="right"
				>
					{detailQuery.isLoading || !selected ? (
						<div className="flex h-full items-center justify-center">
							<Spinner />
						</div>
					) : (
						<div className="px-6">
							<ApplicationDrawer
								selected={selected}
								checklist={checklistQuery.data}
								checklistLoading={checklistQuery.isLoading}
								classes={classes}
								programs={programs}
								decisionNotes={decisionNotes}
								setDecisionNotes={setDecisionNotes}
								registrationNumber={registrationNumber}
								setRegistrationNumber={setRegistrationNumber}
								targetClassId={targetClassId}
								setTargetClassId={setTargetClassId}
								onSetUnderReview={() => setUnderReview.mutate(selected.id)}
								onReview={(status) =>
									reviewApplication.mutate({
										id: selected.id,
										status,
										reviewNotes: decisionNotes || undefined,
									})
								}
								onReviewDocument={(id, status) =>
									reviewDocument.mutate({ id, status })
								}
								onConvert={() => convertApplication.mutate(selected.id)}
								isPending={{
									underReview: setUnderReview.isPending,
									review: reviewApplication.isPending,
									convert: convertApplication.isPending,
								}}
								t={t}
							/>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}

// ─── Application Drawer ────────────────────────────────────────────────────

type Program = { id: string; name: string; code: string };
type ClassOption = {
	id: string;
	name: string;
	code: string;
	program: string;
	academicYear: string;
};

function ApplicationDrawer({
	selected,
	checklist,
	checklistLoading,
	classes,
	programs,
	decisionNotes,
	setDecisionNotes,
	registrationNumber,
	setRegistrationNumber,
	targetClassId,
	setTargetClassId,
	onSetUnderReview,
	onReview,
	onReviewDocument,
	onConvert,
	isPending,
	t,
}: {
	selected: ApplicationDetail;
	checklist?: Checklist;
	checklistLoading: boolean;
	classes: ClassOption[];
	programs: Program[];
	decisionNotes: string;
	setDecisionNotes: (v: string) => void;
	registrationNumber: string;
	setRegistrationNumber: (v: string) => void;
	targetClassId: string;
	setTargetClassId: (v: string) => void;
	onSetUnderReview: () => void;
	onReview: (status: "accepted" | "rejected" | "waitlisted") => void;
	onReviewDocument: (id: string, status: "valid" | "invalid") => void;
	onConvert: () => void;
	isPending: { underReview: boolean; review: boolean; convert: boolean };
	t: (k: string, opts?: Record<string, unknown>) => string;
}) {
	const ap = selected.applicant;
	const programName = (id?: string | null) =>
		programs.find((p) => p.id === id)?.name;

	return (
		<div className="space-y-0 pb-10">
			{/* Header */}
			<SheetHeader className="sticky top-0 z-10 border-b bg-background pb-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<SheetTitle className="text-lg">
							{ap.lastName} {ap.firstName}
						</SheetTitle>
						<p className="font-mono text-muted-foreground text-xs">
							{ap.referenceCode}
						</p>
					</div>
					<StatusBadge
						status={selected.convertedStudentId ? "converted" : selected.status}
					/>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="mt-2 w-full gap-2"
					asChild
				>
					<Link to={`/admin/admissions/${selected.id}`}>
						<ExternalLink className="size-3.5" />
						{t("admissions.admin.fullDossier")}
					</Link>
				</Button>
			</SheetHeader>

			<div className="space-y-6 pt-5">
				{/* ── 1. État civil ── */}
				<DrawerSection title={t("admissions.steps.1.title")}>
					<InfoGrid>
						<Info
							label={t("admissions.fields.gender")}
							value={
								ap.gender ? t(`admissions.options.gender.${ap.gender}`) : "—"
							}
						/>
						<Info
							label={t("admissions.fields.dateOfBirth")}
							value={ap.dateOfBirth ?? "—"}
						/>
						<Info
							label={t("admissions.fields.placeOfBirth")}
							value={ap.placeOfBirth ?? "—"}
						/>
						<Info
							label={t("admissions.fields.countryOfBirth")}
							value={ap.countryOfBirth ?? "—"}
						/>
						<Info
							label={t("admissions.fields.nationality")}
							value={ap.nationality ?? "—"}
						/>
						<Info
							label={t("admissions.fields.idCardNumber")}
							value={ap.idCardNumber ?? "—"}
						/>
						<Info
							label={t("admissions.fields.maritalStatus")}
							value={
								ap.maritalStatus
									? t(`admissions.options.maritalStatus.${ap.maritalStatus}`)
									: "—"
							}
						/>
						<Info
							label={t("admissions.fields.primaryLanguage")}
							value={
								ap.primaryLanguage
									? t(`admissions.options.language.${ap.primaryLanguage}`)
									: "—"
							}
						/>
					</InfoGrid>
				</DrawerSection>

				{/* ── 2. Coordonnées & Origine ── */}
				<DrawerSection title={t("admissions.steps.2.title")}>
					<InfoGrid>
						<Info label={t("admissions.fields.email")} value={ap.email} />
						<Info
							label={t("admissions.fields.phone")}
							value={ap.phone ?? "—"}
						/>
						{ap.whatsapp && (
							<Info
								label={t("admissions.fields.whatsapp")}
								value={ap.whatsapp}
							/>
						)}
						{ap.address && (
							<Info
								label={t("admissions.fields.address")}
								value={ap.address}
								wide
							/>
						)}
						<Info label={t("admissions.fields.city")} value={ap.city ?? "—"} />
						{ap.postalBox && (
							<Info
								label={t("admissions.fields.postalBox")}
								value={ap.postalBox}
							/>
						)}
						<Info
							label={t("admissions.fields.originCountry")}
							value={ap.originCountry ?? "—"}
						/>
						<Info
							label={t("admissions.fields.originRegion")}
							value={ap.originRegion ?? "—"}
						/>
						<Info
							label={t("admissions.fields.originDepartment")}
							value={ap.originDepartment ?? "—"}
						/>
						<Info
							label={t("admissions.fields.studentStatus")}
							value={
								ap.studentStatus
									? t(`admissions.options.studentStatus.${ap.studentStatus}`)
									: "—"
							}
						/>
						<Info
							label={t("admissions.fields.employmentStatus")}
							value={
								ap.employmentStatus
									? t(
											`admissions.options.employmentStatus.${ap.employmentStatus}`,
										)
									: "—"
							}
						/>
					</InfoGrid>
				</DrawerSection>

				{/* ── 3. Baccalauréat ── */}
				<DrawerSection title={t("admissions.steps.3.title")}>
					<InfoGrid>
						<Info
							label={t("admissions.fields.entryDiplomaType")}
							value={
								ap.entryDiplomaType
									? t(`admissions.options.diplomaType.${ap.entryDiplomaType}`)
									: "—"
							}
						/>
						<Info
							label={t("admissions.fields.bacSeries")}
							value={ap.bacSeries ?? "—"}
						/>
						<Info
							label={t("admissions.fields.bacYear")}
							value={ap.bacYear ?? "—"}
						/>
						<Info
							label={t("admissions.fields.bacMention")}
							value={
								ap.bacMention
									? t(`admissions.options.bacMention.${ap.bacMention}`)
									: "—"
							}
						/>
						<Info
							label={t("admissions.fields.bacAverage")}
							value={ap.bacAverage ?? "—"}
						/>
						<Info
							label={t("admissions.fields.bacInstitution")}
							value={ap.bacInstitution ?? "—"}
						/>
						<Info
							label={t("admissions.fields.bacCountry")}
							value={ap.bacCountry ?? "—"}
						/>
						{ap.bacMatricule && (
							<Info
								label={t("admissions.fields.bacMatricule")}
								value={ap.bacMatricule}
							/>
						)}
					</InfoGrid>
				</DrawerSection>

				{/* ── 4. Études supérieures ── */}
				<DrawerSection title={t("admissions.steps.4.title")}>
					{ap.hasPriorHigherEd ? (
						<InfoGrid>
							<Info
								label={t("admissions.fields.priorInstitution")}
								value={ap.priorInstitution ?? "—"}
							/>
							<Info
								label={t("admissions.fields.priorField")}
								value={ap.priorField ?? "—"}
							/>
							<Info
								label={t("admissions.fields.priorLevel")}
								value={ap.priorLevel ?? "—"}
							/>
							<Info
								label={t("admissions.fields.priorStartYear")}
								value={ap.priorStartYear ?? "—"}
							/>
							<Info
								label={t("admissions.fields.priorEndYear")}
								value={ap.priorEndYear ?? "—"}
							/>
							<Info
								label={t("admissions.fields.priorResult")}
								value={
									ap.priorResult
										? t(`admissions.options.priorResult.${ap.priorResult}`)
										: "—"
								}
							/>
						</InfoGrid>
					) : (
						<p className="text-muted-foreground text-sm">
							{t("admissions.wizard.priorHigherEdNo")}
						</p>
					)}
				</DrawerSection>

				{/* ── 5. Choix de formation ── */}
				<DrawerSection title={t("admissions.steps.5.title")}>
					<InfoGrid>
						<Info
							label={t("admissions.fields.program")}
							value={selected.program.name}
							wide
						/>
						{selected.secondChoiceProgramId && (
							<Info
								label={t("admissions.admin.secondChoice")}
								value={
									programName(selected.secondChoiceProgramId) ??
									selected.secondChoiceProgramId
								}
								wide
							/>
						)}
						{selected.thirdChoiceProgramId && (
							<Info
								label={t("admissions.admin.thirdChoice")}
								value={
									programName(selected.thirdChoiceProgramId) ??
									selected.thirdChoiceProgramId
								}
								wide
							/>
						)}
						<Info
							label={t("admissions.fields.academicYear")}
							value={selected.academicYear.name}
						/>
						{selected.academicLevel && (
							<Info
								label={t("admissions.fields.academicLevel")}
								value={selected.academicLevel}
							/>
						)}
						{selected.trainingType && (
							<Info
								label={t("admissions.fields.trainingType")}
								value={t(
									`admissions.options.trainingType.${selected.trainingType}`,
								)}
							/>
						)}
					</InfoGrid>
					{selected.personalStatement && (
						<div className="mt-3 rounded-lg bg-muted/40 p-3">
							<p className="mb-1 text-muted-foreground text-xs">
								{t("admissions.fields.personalStatement")}
							</p>
							<p className="text-sm leading-relaxed">
								{selected.personalStatement}
							</p>
						</div>
					)}
				</DrawerSection>

				{/* ── 6. Famille & Urgence ── */}
				<DrawerSection title={t("admissions.steps.6.title")}>
					<div className="space-y-3">
						{(ap.fatherName || ap.motherName) && (
							<InfoGrid>
								{ap.fatherName && (
									<Info
										label={t("admissions.fields.fatherName")}
										value={ap.fatherName}
									/>
								)}
								{ap.fatherProfession && (
									<Info
										label={t("admissions.fields.fatherProfession")}
										value={ap.fatherProfession}
									/>
								)}
								{ap.fatherPhone && (
									<Info
										label={t("admissions.fields.fatherPhone")}
										value={ap.fatherPhone}
									/>
								)}
								{ap.motherName && (
									<Info
										label={t("admissions.fields.motherName")}
										value={ap.motherName}
									/>
								)}
								{ap.motherProfession && (
									<Info
										label={t("admissions.fields.motherProfession")}
										value={ap.motherProfession}
									/>
								)}
								{ap.motherPhone && (
									<Info
										label={t("admissions.fields.motherPhone")}
										value={ap.motherPhone}
									/>
								)}
							</InfoGrid>
						)}
						{ap.guardianName && (
							<InfoGrid>
								<Info
									label={t("admissions.fields.guardianName")}
									value={ap.guardianName}
								/>
								{ap.guardianRelation && (
									<Info
										label={t("admissions.fields.guardianRelation")}
										value={ap.guardianRelation}
									/>
								)}
								{ap.guardianPhone && (
									<Info
										label={t("admissions.fields.guardianPhone")}
										value={ap.guardianPhone}
									/>
								)}
							</InfoGrid>
						)}
						{ap.emergencyContactName && (
							<InfoGrid>
								<Info
									label={t("admissions.fields.emergencyContactName")}
									value={ap.emergencyContactName}
								/>
								{ap.emergencyContactPhone && (
									<Info
										label={t("admissions.fields.emergencyContactPhone")}
										value={ap.emergencyContactPhone}
									/>
								)}
								{ap.emergencyContactCity && (
									<Info
										label={t("admissions.fields.emergencyContactCity")}
										value={ap.emergencyContactCity}
									/>
								)}
							</InfoGrid>
						)}
						{!ap.fatherName &&
							!ap.motherName &&
							!ap.guardianName &&
							!ap.emergencyContactName && (
								<p className="text-muted-foreground text-sm">—</p>
							)}
					</div>
				</DrawerSection>

				{/* ── 7. Documents ── */}
				<DrawerSection
					title={t("admissions.admin.documentsTitle")}
					icon={<FileCheck2 className="size-3.5" />}
				>
					{checklistLoading && <Spinner />}
					{!checklistLoading && checklist?.items.length === 0 && (
						<p className="text-muted-foreground text-sm">
							{t("admissions.status.noRequirements")}
						</p>
					)}
					<div className="space-y-2">
						{checklist?.items.map((item) => (
							<div
								key={item.requirement.id}
								className="flex items-start gap-3 rounded-lg border p-3"
							>
								<div
									className={`mt-0.5 size-2 shrink-0 rounded-full ${item.valid ? "bg-emerald-500" : item.missing ? "bg-destructive" : "bg-amber-400"}`}
								/>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-sm">
										{item.requirement.label}
									</p>
									{item.document?.fileName ? (
										<a
											href={item.document.fileUrl}
											target="_blank"
											rel="noreferrer"
											className="truncate text-muted-foreground text-xs hover:text-primary hover:underline"
										>
											{item.document.fileName}
										</a>
									) : (
										<p className="text-muted-foreground text-xs">
											{t("admissions.admin.missingFile")}
										</p>
									)}
								</div>
								<div className="flex shrink-0 gap-1.5">
									<Button
										size="sm"
										variant={item.valid ? "default" : "outline"}
										className="h-7 px-2 text-xs"
										disabled={!item.document}
										onClick={() =>
											item.document &&
											onReviewDocument(item.document.id, "valid")
										}
									>
										<CheckCircle2 className="size-3" />
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="h-7 px-2 text-xs"
										disabled={!item.document}
										onClick={() =>
											item.document &&
											onReviewDocument(item.document.id, "invalid")
										}
									>
										<XCircle className="size-3" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</DrawerSection>

				{/* ── Décision ── */}
				{!selected.convertedStudentId &&
					["submitted", "under_review"].includes(selected.status) && (
						<DrawerSection title={t("admissions.admin.reviewTitle")}>
							<Textarea
								rows={3}
								value={decisionNotes}
								onChange={(e) => setDecisionNotes(e.target.value)}
								placeholder={t("admissions.admin.reviewNotes")}
							/>
							<div className="mt-3 flex flex-wrap gap-2">
								{selected.status === "submitted" && (
									<Button
										variant="outline"
										size="sm"
										onClick={onSetUnderReview}
										disabled={isPending.underReview}
									>
										{t("admissions.admin.markUnderReview")}
									</Button>
								)}
								<Button
									size="sm"
									onClick={() => onReview("accepted")}
									disabled={isPending.review}
								>
									<CheckCircle2 className="mr-1.5 size-3.5" />
									{t("admissions.admin.accept")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onReview("waitlisted")}
									disabled={isPending.review}
								>
									{t("admissions.admin.waitlist")}
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => onReview("rejected")}
									disabled={isPending.review || !decisionNotes.trim()}
								>
									<XCircle className="mr-1.5 size-3.5" />
									{t("admissions.admin.reject")}
								</Button>
							</div>
						</DrawerSection>
					)}

				{/* ── Conversion ── */}
				{selected.status === "accepted" && !selected.convertedStudentId && (
					<DrawerSection title={t("admissions.admin.convertTitle")}>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label>{t("admissions.fields.class")}</Label>
								<Select value={targetClassId} onValueChange={setTargetClassId}>
									<SelectTrigger>
										<SelectValue
											placeholder={t("admissions.admin.useApplicationClass")}
										/>
									</SelectTrigger>
									<SelectContent>
										{classes.map((k) => (
											<SelectItem key={k.id} value={k.id}>
												{k.name} ({k.code})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label>{t("admissions.admin.registrationNumber")}</Label>
								<Input
									value={registrationNumber}
									onChange={(e) => setRegistrationNumber(e.target.value)}
									placeholder={t("admissions.admin.autoRegistration")}
								/>
							</div>
						</div>
						<Button
							className="mt-3"
							onClick={onConvert}
							disabled={isPending.convert}
						>
							<GraduationCap className="mr-2 size-4" />
							{t("admissions.admin.convert")}
						</Button>
					</DrawerSection>
				)}

				{/* ── Converti ── */}
				{selected.convertedStudentId && (
					<div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-700 text-sm dark:text-emerald-400">
						<CheckCircle2 className="mb-1 size-5" />
						{t("admissions.admin.converted")}
					</div>
				)}

				{/* ── Notes de décision existantes ── */}
				{selected.reviewNotes && (
					<DrawerSection title={t("admissions.admin.reviewNotes")}>
						<p className="rounded-lg bg-muted/40 p-3 text-sm">
							{selected.reviewNotes}
						</p>
					</DrawerSection>
				)}
			</div>
		</div>
	);
}

function DrawerSection({
	title,
	icon,
	children,
}: {
	title: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section>
			<p className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
				{icon}
				{title}
			</p>
			{children}
			<div className="mt-5 border-b" />
		</section>
	);
}

function InfoGrid({ children }: { children: React.ReactNode }) {
	return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Info({
	label,
	value,
	wide,
}: {
	label: string;
	value: string;
	wide?: boolean;
}) {
	return (
		<div
			className={`rounded-lg bg-muted/40 px-3 py-2 ${wide ? "col-span-2" : ""}`}
		>
			<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
				{label}
			</p>
			<p className="font-medium text-sm">{value}</p>
		</div>
	);
}
