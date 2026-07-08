import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileCheck2, GraduationCap, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

type AdmissionStatus =
	| "submitted"
	| "under_review"
	| "accepted"
	| "rejected"
	| "waitlisted";
type ApplicationRow = RouterOutputs["admissions"]["list"][number];
type ApplicationDetail = RouterOutputs["admissions"]["get"];
type Checklist = RouterOutputs["admissions"]["getChecklist"];

const ALL_STATUSES = "__all_statuses__";
const NO_CLASS = "__no_class__";

export default function AdmissionsManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<string>(ALL_STATUSES);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [decisionNotes, setDecisionNotes] = useState("");
	const [registrationNumber, setRegistrationNumber] = useState("");
	const [targetClassId, setTargetClassId] = useState(NO_CLASS);

	const listInput = {
		status: status === ALL_STATUSES ? undefined : (status as AdmissionStatus),
		limit: 100,
		offset: 0,
	};
	const listQuery = useQuery(trpc.admissions.list.queryOptions(listInput));
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

	const invalidateAdmissions = () => {
		queryClient.invalidateQueries(trpc.admissions.list.queryKey());
		if (selectedId) {
			queryClient.invalidateQueries(
				trpc.admissions.get.queryKey({ id: selectedId }),
			);
			queryClient.invalidateQueries(
				trpc.admissions.getChecklist.queryKey({ applicationId: selectedId }),
			);
		}
	};

	const setUnderReview = useMutation({
		mutationFn: (id: string) =>
			trpcClient.admissions.setUnderReview.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.updated"));
			invalidateAdmissions();
		},
		onError: (error: Error) => toast.error(error.message),
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
			invalidateAdmissions();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const reviewDocument = useMutation({
		mutationFn: (input: {
			id: string;
			status: "valid" | "invalid";
			reviewNotes?: string;
		}) => trpcClient.admissions.reviewDocument.mutate(input),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.documentReviewed"));
			invalidateAdmissions();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const convertApplication = useMutation({
		mutationFn: (id: string) =>
			trpcClient.admissions.convert.mutate({
				id,
				classId: targetClassId === NO_CLASS ? undefined : targetClassId,
				registrationNumber: registrationNumber.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.converted"));
			setRegistrationNumber("");
			invalidateAdmissions();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const selected = detailQuery.data;
	const classes = (optionsQuery.data?.classes ?? []).filter((klass) => {
		if (!selected) return true;
		return (
			klass.program === selected.programId &&
			klass.academicYear === selected.academicYearId
		);
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-semibold text-2xl">
						{t("admissions.admin.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admissions.admin.subtitle")}
					</p>
				</div>
				<div className="w-full md:w-60">
					<Select value={status} onValueChange={setStatus}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_STATUSES}>
								{t("admissions.admin.allStatuses")}
							</SelectItem>
							{[
								"submitted",
								"under_review",
								"accepted",
								"rejected",
								"waitlisted",
							].map((value) => (
								<SelectItem key={value} value={value}>
									{t(`admissions.statuses.${value}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[360px_1fr]">
				<Card className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Search className="size-4" />
							{t("admissions.admin.queue")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{listQuery.isLoading && <Spinner />}
						{(listQuery.data ?? []).map((application) => (
							<ApplicationListItem
								key={application.id}
								application={application}
								isSelected={application.id === selectedId}
								onSelect={() => {
									setSelectedId(application.id);
									setTargetClassId(application.classId ?? NO_CLASS);
								}}
							/>
						))}
						{!listQuery.isLoading && (listQuery.data ?? []).length === 0 && (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admissions.admin.empty")}
							</p>
						)}
					</CardContent>
				</Card>

				{selected ? (
					<div className="space-y-6">
						<ApplicationDetailCard application={selected} />
						<ChecklistCard
							checklist={checklistQuery.data}
							onReview={(id, status) =>
								reviewDocument.mutate({
									id,
									status,
								})
							}
						/>
						<Card>
							<CardHeader>
								<CardTitle>{t("admissions.admin.reviewTitle")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Textarea
									value={decisionNotes}
									onChange={(event) => setDecisionNotes(event.target.value)}
									placeholder={t("admissions.admin.reviewNotes")}
								/>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										onClick={() => setUnderReview.mutate(selected.id)}
										disabled={selected.status !== "submitted"}
									>
										{t("admissions.admin.markUnderReview")}
									</Button>
									<Button
										onClick={() =>
											reviewApplication.mutate({
												id: selected.id,
												status: "accepted",
												reviewNotes: decisionNotes || undefined,
											})
										}
										disabled={
											!["submitted", "under_review"].includes(selected.status)
										}
									>
										{t("admissions.admin.accept")}
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											reviewApplication.mutate({
												id: selected.id,
												status: "waitlisted",
												reviewNotes: decisionNotes || undefined,
											})
										}
										disabled={
											!["submitted", "under_review"].includes(selected.status)
										}
									>
										{t("admissions.admin.waitlist")}
									</Button>
									<Button
										variant="destructive"
										onClick={() =>
											reviewApplication.mutate({
												id: selected.id,
												status: "rejected",
												reviewNotes: decisionNotes || undefined,
											})
										}
										disabled={
											!["submitted", "under_review"].includes(
												selected.status,
											) || !decisionNotes.trim()
										}
									>
										{t("admissions.admin.reject")}
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("admissions.admin.convertTitle")}</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
								<div className="space-y-2">
									<Label>{t("admissions.fields.class")}</Label>
									<Select
										value={targetClassId}
										onValueChange={setTargetClassId}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={NO_CLASS}>
												{t("admissions.admin.useApplicationClass")}
											</SelectItem>
											{classes.map((klass) => (
												<SelectItem key={klass.id} value={klass.id}>
													{klass.name} ({klass.code})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>{t("admissions.admin.registrationNumber")}</Label>
									<Input
										value={registrationNumber}
										onChange={(event) =>
											setRegistrationNumber(event.target.value)
										}
										placeholder={t("admissions.admin.autoRegistration")}
									/>
								</div>
								<div className="flex items-end">
									<Button
										onClick={() => convertApplication.mutate(selected.id)}
										disabled={
											selected.status !== "accepted" ||
											!!selected.convertedStudentId ||
											convertApplication.isPending
										}
									>
										<GraduationCap className="mr-2 size-4" />
										{t("admissions.admin.convert")}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				) : (
					<Card>
						<CardContent className="flex min-h-96 items-center justify-center text-muted-foreground">
							{t("admissions.admin.selectApplication")}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

function ApplicationListItem({
	application,
	isSelected,
	onSelect,
}: {
	application: ApplicationRow;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const { t } = useTranslation();
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`w-full rounded-xl border p-3 text-left transition ${
				isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
			}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium">
						{application.applicant.firstName} {application.applicant.lastName}
					</p>
					<p className="text-muted-foreground text-xs">
						{application.program.name} · {application.academicYear.name}
					</p>
				</div>
				<Badge variant="outline">
					{t(`admissions.statuses.${application.status}`)}
				</Badge>
			</div>
		</button>
	);
}

function ApplicationDetailCard({
	application,
}: {
	application: ApplicationDetail;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>
						{application.applicant.firstName} {application.applicant.lastName}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{application.applicant.email}
					</p>
				</div>
				<Badge variant={application.convertedStudentId ? "success" : "outline"}>
					{application.convertedStudentId
						? t("admissions.admin.converted")
						: t(`admissions.statuses.${application.status}`)}
				</Badge>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2">
				<Info
					label={t("admissions.fields.program")}
					value={application.program.name}
				/>
				<Info
					label={t("admissions.fields.academicYear")}
					value={application.academicYear.name}
				/>
				<Info
					label={t("admissions.fields.class")}
					value={application.class?.name ?? "—"}
				/>
				<Info
					label={t("admissions.fields.phone")}
					value={application.applicant.phone ?? "—"}
				/>
				<div className="md:col-span-2">
					<Info
						label={t("admissions.fields.personalStatement")}
						value={application.personalStatement ?? "—"}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function ChecklistCard({
	checklist,
	onReview,
}: {
	checklist?: Checklist;
	onReview: (id: string, status: "valid" | "invalid") => void;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileCheck2 className="size-4" />
					{t("admissions.admin.documentsTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{!checklist && <Spinner />}
				{checklist?.items.map((item) => (
					<div key={item.requirement.id} className="rounded-xl border p-3">
						<div className="flex flex-col justify-between gap-3 md:flex-row">
							<div>
								<p className="font-medium">{item.requirement.label}</p>
								<p className="text-muted-foreground text-sm">
									{item.document?.fileName ?? t("admissions.admin.missingFile")}
								</p>
								{item.document?.fileUrl && (
									<a
										href={item.document.fileUrl}
										target="_blank"
										rel="noreferrer"
										className="text-primary text-sm underline"
									>
										{item.document.fileUrl}
									</a>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Badge variant={item.valid ? "success" : "outline"}>
									{item.document
										? t(`admissions.documentStatuses.${item.document.status}`)
										: t("admissions.status.missing")}
								</Badge>
								<Button
									size="sm"
									variant="outline"
									disabled={!item.document}
									onClick={() =>
										item.document && onReview(item.document.id, "valid")
									}
								>
									<CheckCircle2 className="mr-1 size-3" />
									{t("admissions.admin.valid")}
								</Button>
								<Button
									size="sm"
									variant="outline"
									disabled={!item.document}
									onClick={() =>
										item.document && onReview(item.document.id, "invalid")
									}
								>
									{t("admissions.admin.invalid")}
								</Button>
							</div>
						</div>
					</div>
				))}
				{checklist?.items.length === 0 && (
					<p className="text-muted-foreground text-sm">
						{t("admissions.status.noRequirements")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function Info({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-muted/40 p-3">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="font-medium text-sm">{value}</p>
		</div>
	);
}
