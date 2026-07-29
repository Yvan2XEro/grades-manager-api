import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle2,
	FileCheck2,
	GraduationCap,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const STATUS_COLORS: Record<string, string> = {
	submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
	under_review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
	waitlisted: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
	converted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export default function AdmissionDetail() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [decisionNotes, setDecisionNotes] = useState("");
	const [registrationNumber, setRegistrationNumber] = useState("");
	const [targetClassId, setTargetClassId] = useState("");

	const appQuery = useQuery(
		trpc.admissions.get.queryOptions({ id: id ?? "" }, { enabled: !!id }),
	);
	const checklistQuery = useQuery(
		trpc.admissions.getChecklist.queryOptions(
			{ applicationId: id ?? "" },
			{ enabled: !!id },
		),
	);
	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());

	const app = appQuery.data;
	const ap = app?.applicant;
	const programs = optionsQuery.data?.programs ?? [];
	const classes = (optionsQuery.data?.classes ?? []).filter((k) =>
		app
			? k.program === app.programId && k.academicYear === app.academicYearId
			: true,
	);

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.get.queryKey({ id: id ?? "" }),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.getChecklist.queryKey({
				applicationId: id ?? "",
			}),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.list.queryKey(),
		});
	};

	const setUnderReview = useMutation({
		mutationFn: () => trpcClient.admissions.setUnderReview.mutate({ id: id! }),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.updated"));
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const reviewMutation = useMutation({
		mutationFn: (input: {
			status: "accepted" | "rejected" | "waitlisted";
			reviewNotes?: string;
		}) => trpcClient.admissions.review.mutate({ id: id!, ...input }),
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

	const convertMutation = useMutation({
		mutationFn: () =>
			trpcClient.admissions.convert.mutate({
				id: id!,
				classId: targetClassId || undefined,
				registrationNumber: registrationNumber.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.converted"));
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const programName = (pid?: string | null) =>
		programs.find((p) => p.id === pid)?.name;

	if (appQuery.isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!app || !ap) {
		return (
			<div className="flex h-96 flex-col items-center justify-center gap-3 text-muted-foreground">
				<p>{t("admissions.admin.notFound")}</p>
				<Button variant="ghost" asChild>
					<Link to="/admin/admissions">
						<ArrowLeft className="mr-2 size-4" />
						{t("common.back")}
					</Link>
				</Button>
			</div>
		);
	}

	const statusKey = app.convertedStudentId ? "converted" : app.status;

	return (
		<div className="space-y-6">
			{/* Back + Header */}
			<div className="flex items-start gap-4">
				<Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
					<Link to="/admin/admissions">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-semibold text-2xl">
							{ap.lastName} {ap.firstName}
						</h1>
						<span
							className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${STATUS_COLORS[statusKey] ?? "bg-muted text-muted-foreground"}`}
						>
							{t(`admissions.statuses.${statusKey}`)}
						</span>
					</div>
					<p className="font-mono text-muted-foreground text-sm">
						{ap.referenceCode}
					</p>
					<p className="text-muted-foreground text-sm">
						{app.program.name} · {app.academicYear.name}
						{app.submittedAt
							? ` · ${t("admissions.admin.cols.date")} ${new Date(app.submittedAt).toLocaleDateString("fr-FR")}`
							: ""}
					</p>
				</div>
			</div>

			<Tabs defaultValue="dossier">
				<TabsList>
					<TabsTrigger value="dossier">
						{t("admissions.admin.tabs.dossier")}
					</TabsTrigger>
					<TabsTrigger value="documents">
						{t("admissions.admin.tabs.documents")}
						{checklistQuery.data?.missingRequiredCount ? (
							<span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
								{checklistQuery.data.missingRequiredCount}
							</span>
						) : null}
					</TabsTrigger>
					<TabsTrigger value="decision">
						{t("admissions.admin.tabs.decision")}
					</TabsTrigger>
				</TabsList>

				{/* ── Dossier complet ── */}
				<TabsContent value="dossier" className="space-y-5 pt-4">
					<div className="grid gap-5 lg:grid-cols-2">
						{/* État civil */}
						<DossierCard title={t("admissions.steps.1.title")}>
							<InfoRow
								label={t("admissions.fields.gender")}
								value={
									ap.gender
										? t(`admissions.options.gender.${ap.gender}`)
										: undefined
								}
							/>
							<InfoRow
								label={t("admissions.fields.dateOfBirth")}
								value={ap.dateOfBirth}
							/>
							<InfoRow
								label={t("admissions.fields.placeOfBirth")}
								value={ap.placeOfBirth}
							/>
							<InfoRow
								label={t("admissions.fields.countryOfBirth")}
								value={ap.countryOfBirth}
							/>
							<InfoRow
								label={t("admissions.fields.nationality")}
								value={ap.nationality}
							/>
							<InfoRow
								label={t("admissions.fields.idCardNumber")}
								value={ap.idCardNumber}
							/>
							<InfoRow
								label={t("admissions.fields.maritalStatus")}
								value={
									ap.maritalStatus
										? t(`admissions.options.maritalStatus.${ap.maritalStatus}`)
										: undefined
								}
							/>
							<InfoRow
								label={t("admissions.fields.primaryLanguage")}
								value={
									ap.primaryLanguage
										? t(`admissions.options.language.${ap.primaryLanguage}`)
										: undefined
								}
							/>
						</DossierCard>

						{/* Coordonnées */}
						<DossierCard title={t("admissions.steps.2.title")}>
							<InfoRow label={t("admissions.fields.email")} value={ap.email} />
							<InfoRow label={t("admissions.fields.phone")} value={ap.phone} />
							<InfoRow
								label={t("admissions.fields.whatsapp")}
								value={ap.whatsapp}
							/>
							<InfoRow
								label={t("admissions.fields.address")}
								value={ap.address}
							/>
							<InfoRow label={t("admissions.fields.city")} value={ap.city} />
							<InfoRow
								label={t("admissions.fields.postalBox")}
								value={ap.postalBox}
							/>
							<InfoRow
								label={t("admissions.fields.originCountry")}
								value={ap.originCountry}
							/>
							<InfoRow
								label={t("admissions.fields.originRegion")}
								value={ap.originRegion}
							/>
							<InfoRow
								label={t("admissions.fields.originDepartment")}
								value={ap.originDepartment}
							/>
							<InfoRow
								label={t("admissions.fields.studentStatus")}
								value={
									ap.studentStatus
										? t(`admissions.options.studentStatus.${ap.studentStatus}`)
										: undefined
								}
							/>
							<InfoRow
								label={t("admissions.fields.employmentStatus")}
								value={
									ap.employmentStatus
										? t(
												`admissions.options.employmentStatus.${ap.employmentStatus}`,
											)
										: undefined
								}
							/>
						</DossierCard>

						{/* Baccalauréat */}
						<DossierCard title={t("admissions.steps.3.title")}>
							<InfoRow
								label={t("admissions.fields.entryDiplomaType")}
								value={
									ap.entryDiplomaType
										? t(`admissions.options.diplomaType.${ap.entryDiplomaType}`)
										: undefined
								}
							/>
							<InfoRow
								label={t("admissions.fields.bacSeries")}
								value={ap.bacSeries}
							/>
							<InfoRow
								label={t("admissions.fields.bacYear")}
								value={ap.bacYear}
							/>
							<InfoRow
								label={t("admissions.fields.bacMention")}
								value={
									ap.bacMention
										? t(`admissions.options.bacMention.${ap.bacMention}`)
										: undefined
								}
							/>
							<InfoRow
								label={t("admissions.fields.bacAverage")}
								value={ap.bacAverage}
							/>
							<InfoRow
								label={t("admissions.fields.bacInstitution")}
								value={ap.bacInstitution}
							/>
							<InfoRow
								label={t("admissions.fields.bacCountry")}
								value={ap.bacCountry}
							/>
							<InfoRow
								label={t("admissions.fields.bacMatricule")}
								value={ap.bacMatricule}
							/>
						</DossierCard>

						{/* Études supérieures */}
						<DossierCard title={t("admissions.steps.4.title")}>
							{ap.hasPriorHigherEd ? (
								<>
									<InfoRow
										label={t("admissions.fields.priorInstitution")}
										value={ap.priorInstitution}
									/>
									<InfoRow
										label={t("admissions.fields.priorField")}
										value={ap.priorField}
									/>
									<InfoRow
										label={t("admissions.fields.priorLevel")}
										value={ap.priorLevel}
									/>
									<InfoRow
										label={t("admissions.fields.priorStartYear")}
										value={ap.priorStartYear}
									/>
									<InfoRow
										label={t("admissions.fields.priorEndYear")}
										value={ap.priorEndYear}
									/>
									<InfoRow
										label={t("admissions.fields.priorResult")}
										value={
											ap.priorResult
												? t(`admissions.options.priorResult.${ap.priorResult}`)
												: undefined
										}
									/>
								</>
							) : (
								<p className="py-1 text-muted-foreground text-sm">
									{t("admissions.wizard.priorHigherEdNo")}
								</p>
							)}
						</DossierCard>

						{/* Choix de formation */}
						<DossierCard title={t("admissions.steps.5.title")}>
							<InfoRow
								label={t("admissions.fields.program")}
								value={app.program.name}
							/>
							{app.secondChoiceProgramId && (
								<InfoRow
									label={t("admissions.admin.secondChoice")}
									value={
										programName(app.secondChoiceProgramId) ??
										app.secondChoiceProgramId
									}
								/>
							)}
							{app.thirdChoiceProgramId && (
								<InfoRow
									label={t("admissions.admin.thirdChoice")}
									value={
										programName(app.thirdChoiceProgramId) ??
										app.thirdChoiceProgramId
									}
								/>
							)}
							<InfoRow
								label={t("admissions.fields.academicYear")}
								value={app.academicYear.name}
							/>
							<InfoRow
								label={t("admissions.fields.academicLevel")}
								value={app.academicLevel}
							/>
							<InfoRow
								label={t("admissions.fields.trainingType")}
								value={
									app.trainingType
										? t(`admissions.options.trainingType.${app.trainingType}`)
										: undefined
								}
							/>
							{app.personalStatement && (
								<div className="col-span-2 mt-2 rounded-lg bg-muted/40 p-3">
									<p className="mb-1 text-muted-foreground text-xs">
										{t("admissions.fields.personalStatement")}
									</p>
									<p className="text-sm leading-relaxed">
										{app.personalStatement}
									</p>
								</div>
							)}
						</DossierCard>

						{/* Famille */}
						<DossierCard title={t("admissions.steps.6.title")}>
							<InfoRow
								label={t("admissions.fields.fatherName")}
								value={ap.fatherName}
							/>
							<InfoRow
								label={t("admissions.fields.fatherProfession")}
								value={ap.fatherProfession}
							/>
							<InfoRow
								label={t("admissions.fields.fatherPhone")}
								value={ap.fatherPhone}
							/>
							<InfoRow
								label={t("admissions.fields.motherName")}
								value={ap.motherName}
							/>
							<InfoRow
								label={t("admissions.fields.motherProfession")}
								value={ap.motherProfession}
							/>
							<InfoRow
								label={t("admissions.fields.motherPhone")}
								value={ap.motherPhone}
							/>
							{ap.guardianName && (
								<>
									<InfoRow
										label={t("admissions.fields.guardianName")}
										value={ap.guardianName}
									/>
									<InfoRow
										label={t("admissions.fields.guardianRelation")}
										value={ap.guardianRelation}
									/>
									<InfoRow
										label={t("admissions.fields.guardianPhone")}
										value={ap.guardianPhone}
									/>
								</>
							)}
							<InfoRow
								label={t("admissions.fields.emergencyContactName")}
								value={ap.emergencyContactName}
							/>
							<InfoRow
								label={t("admissions.fields.emergencyContactPhone")}
								value={ap.emergencyContactPhone}
							/>
							<InfoRow
								label={t("admissions.fields.emergencyContactCity")}
								value={ap.emergencyContactCity}
							/>
						</DossierCard>
					</div>
				</TabsContent>

				{/* ── Documents ── */}
				<TabsContent value="documents" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<FileCheck2 className="size-4" />
								{t("admissions.admin.documentsTitle")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{checklistQuery.isLoading && <Spinner />}
							{!checklistQuery.isLoading &&
								checklistQuery.data?.items.length === 0 && (
									<p className="text-muted-foreground text-sm">
										{t("admissions.status.noRequirements")}
									</p>
								)}
							{checklistQuery.data?.items.map((item) => (
								<div
									key={item.requirement.id}
									className="flex items-start gap-4 rounded-lg border p-4"
								>
									<div
										className={`mt-1 size-2.5 shrink-0 rounded-full ${item.valid ? "bg-emerald-500" : item.missing ? "bg-destructive" : "bg-amber-400"}`}
									/>
									<div className="min-w-0 flex-1">
										<p className="font-medium">{item.requirement.label}</p>
										<p className="text-muted-foreground text-xs">
											{item.requirement.description}
										</p>
										{item.requirement.isRequired && (
											<span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
												{t("admissions.documents.required")}
											</span>
										)}
										{item.document?.fileName ? (
											<a
												href={item.document.fileUrl}
												target="_blank"
												rel="noreferrer"
												className="mt-1 block truncate text-primary text-sm hover:underline"
											>
												{item.document.fileName}
											</a>
										) : (
											<p className="mt-1 text-muted-foreground text-sm">
												{t("admissions.admin.missingFile")}
											</p>
										)}
									</div>
									<div className="flex shrink-0 gap-2">
										<Button
											size="sm"
											variant={item.valid ? "default" : "outline"}
											disabled={!item.document || reviewDocument.isPending}
											onClick={() =>
												item.document &&
												reviewDocument.mutate({
													id: item.document.id,
													status: "valid",
												})
											}
										>
											<CheckCircle2 className="mr-1.5 size-3.5" />
											{t("admissions.admin.valid")}
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="text-destructive hover:text-destructive"
											disabled={!item.document || reviewDocument.isPending}
											onClick={() =>
												item.document &&
												reviewDocument.mutate({
													id: item.document.id,
													status: "invalid",
												})
											}
										>
											<XCircle className="mr-1.5 size-3.5" />
											{t("admissions.admin.invalid")}
										</Button>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ── Décision ── */}
				<TabsContent value="decision" className="space-y-5 pt-4">
					{app.reviewNotes && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{t("admissions.admin.reviewNotes")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed">{app.reviewNotes}</p>
							</CardContent>
						</Card>
					)}

					{app.convertedStudentId ? (
						<div className="rounded-xl border bg-emerald-500/10 p-6 text-emerald-700 dark:text-emerald-400">
							<CheckCircle2 className="mb-2 size-6" />
							<p className="font-semibold">{t("admissions.admin.converted")}</p>
						</div>
					) : ["submitted", "under_review"].includes(app.status) ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{t("admissions.admin.reviewTitle")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Textarea
									rows={4}
									value={decisionNotes}
									onChange={(e) => setDecisionNotes(e.target.value)}
									placeholder={t("admissions.admin.reviewNotes")}
								/>
								<div className="flex flex-wrap gap-3">
									{app.status === "submitted" && (
										<Button
											variant="outline"
											onClick={() => setUnderReview.mutate()}
											disabled={setUnderReview.isPending}
										>
											{t("admissions.admin.markUnderReview")}
										</Button>
									)}
									<Button
										onClick={() =>
											reviewMutation.mutate({
												status: "accepted",
												reviewNotes: decisionNotes || undefined,
											})
										}
										disabled={reviewMutation.isPending}
									>
										<CheckCircle2 className="mr-2 size-4" />
										{t("admissions.admin.accept")}
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											reviewMutation.mutate({
												status: "waitlisted",
												reviewNotes: decisionNotes || undefined,
											})
										}
										disabled={reviewMutation.isPending}
									>
										{t("admissions.admin.waitlist")}
									</Button>
									<Button
										variant="destructive"
										onClick={() =>
											reviewMutation.mutate({
												status: "rejected",
												reviewNotes: decisionNotes || undefined,
											})
										}
										disabled={reviewMutation.isPending || !decisionNotes.trim()}
									>
										<XCircle className="mr-2 size-4" />
										{t("admissions.admin.reject")}
									</Button>
								</div>
							</CardContent>
						</Card>
					) : app.status === "accepted" ? (
						<ConvertSection
							app={app}
							classes={classes}
							targetClassId={targetClassId}
							setTargetClassId={setTargetClassId}
							registrationNumber={registrationNumber}
							setRegistrationNumber={setRegistrationNumber}
							onConvert={() => convertMutation.mutate()}
							isPending={convertMutation.isPending}
							t={t}
						/>
					) : (
						<div className="rounded-xl border bg-muted/40 p-6">
							<p className="text-muted-foreground text-sm">
								{t(`admissions.statuses.${app.status}`)} —{" "}
								{t("admissions.admin.terminalState")}
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function DossierCard({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
			</CardContent>
		</Card>
	);
}

// ─── Convert Section ─────────────────────────────────────────────────────────

type AppDetail = NonNullable<ReturnType<typeof useParams>> & { id: string };

function ConvertSection({
	app,
	classes,
	targetClassId,
	setTargetClassId,
	registrationNumber,
	setRegistrationNumber,
	onConvert,
	isPending,
	t,
}: {
	app: {
		id: string;
		program: { name: string };
		academicYear: { name: string };
		applicant: { firstName: string; lastName: string };
	};
	classes: { id: string; name: string; code: string }[];
	targetClassId: string;
	setTargetClassId: (v: string) => void;
	registrationNumber: string;
	setRegistrationNumber: (v: string) => void;
	onConvert: () => void;
	isPending: boolean;
	t: (k: string) => string;
}) {
	const noClasses = classes.length === 0;
	const canConvert = !noClasses && !!targetClassId;

	return (
		<div className="space-y-4">
			{/* What will happen */}
			<Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base text-emerald-800 dark:text-emerald-300">
						<GraduationCap className="size-5" />
						{t("admissions.admin.convertTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-emerald-800 text-sm dark:text-emerald-300">
					<p className="font-medium">{t("admissions.admin.convertExplain")}</p>
					<ul className="ml-4 list-disc space-y-1 text-emerald-700 dark:text-emerald-400">
						<li>
							{t("admissions.admin.convertStep1")} — {app.applicant.lastName}{" "}
							{app.applicant.firstName}
						</li>
						<li>{t("admissions.admin.convertStep2")}</li>
						<li>
							{t("admissions.admin.convertStep3")} — {app.program.name},{" "}
							{app.academicYear.name}
						</li>
					</ul>
					<p className="mt-2 text-emerald-600 text-xs dark:text-emerald-500">
						{t("admissions.admin.convertIrreversible")}
					</p>
				</CardContent>
			</Card>

			{/* Class picker */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">
						{t("admissions.admin.assignClass")}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{t("admissions.admin.assignClassHint")}
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{noClasses ? (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
							<p className="font-medium text-amber-800 text-sm dark:text-amber-300">
								{t("admissions.admin.noClassesWarning")}
							</p>
							<p className="mt-1 text-amber-700 text-xs dark:text-amber-400">
								{t("admissions.admin.noClassesHint")}
							</p>
						</div>
					) : (
						<div className="space-y-1.5">
							<Label>
								{t("admissions.fields.class")}{" "}
								<span className="text-destructive">*</span>
							</Label>
							<Select value={targetClassId} onValueChange={setTargetClassId}>
								<SelectTrigger
									className={!targetClassId ? "border-amber-400" : ""}
								>
									<SelectValue
										placeholder={t("admissions.admin.selectClass")}
									/>
								</SelectTrigger>
								<SelectContent>
									{classes.map((k) => (
										<SelectItem key={k.id} value={k.id}>
											<span className="font-medium">{k.name}</span>
											<span className="ml-2 text-muted-foreground text-xs">
												({k.code})
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-1.5">
						<Label>{t("admissions.admin.registrationNumber")}</Label>
						<Input
							value={registrationNumber}
							onChange={(e) => setRegistrationNumber(e.target.value)}
							placeholder={t("admissions.admin.autoRegistration")}
						/>
						<p className="text-muted-foreground text-xs">
							{t("admissions.admin.registrationHint")}
						</p>
					</div>

					<Button
						onClick={onConvert}
						disabled={isPending || !canConvert}
						className="w-full sm:w-auto"
					>
						<GraduationCap className="mr-2 size-4" />
						{isPending
							? t("admissions.admin.converting")
							: t("admissions.admin.convert")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	if (!value) return null;
	return (
		<div>
			<dt className="text-[10px] text-muted-foreground uppercase tracking-wide">
				{label}
			</dt>
			<dd className="font-medium text-sm">{value}</dd>
		</div>
	);
}
