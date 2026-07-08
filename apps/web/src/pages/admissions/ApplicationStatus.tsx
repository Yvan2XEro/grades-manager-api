import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Upload, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

export default function ApplicationStatus() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const queryClient = useQueryClient();
	const [referenceCode, setReferenceCode] = useState(
		searchParams.get("ref") ?? "",
	);
	const normalizedRef = referenceCode.trim().toUpperCase();

	const statusQuery = useQuery({
		...trpc.admissions.getStatus.queryOptions(
			{ referenceCode: normalizedRef },
			{ enabled: normalizedRef.length > 0 },
		),
	});

	const submitDocument = useMutation({
		mutationFn: (input: {
			applicationId: string;
			requirementId: string;
			code: string;
			label: string;
			fileName: string;
			fileUrl: string;
		}) => trpcClient.admissions.submitDocument.mutate(input),
		onSuccess: () => {
			toast.success(t("admissions.status.documentSubmitted"));
			queryClient.invalidateQueries(
				trpc.admissions.getStatus.queryKey({ referenceCode: normalizedRef }),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const application = statusQuery.data?.application;
	const checklist = statusQuery.data?.checklist;

	const statusVariant = useMemo(() => {
		switch (application?.status) {
			case "accepted":
				return "success";
			case "rejected":
				return "destructive";
			case "waitlisted":
				return "warning";
			default:
				return "info";
		}
	}, [application?.status]);

	return (
		<div className="min-h-dvh bg-dot-pattern px-4 py-10">
			<div className="mx-auto max-w-4xl space-y-6">
				<div>
					<h1 className="font-semibold text-3xl">
						{t("admissions.status.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admissions.status.subtitle")}
					</p>
				</div>

				<Card>
					<CardContent className="flex flex-col gap-3 pt-6 md:flex-row">
						<Input
							value={referenceCode}
							onChange={(event) => setReferenceCode(event.target.value)}
							placeholder="APP-2026-XXXX-XXXX"
						/>
						<Button
							onClick={() => setSearchParams({ ref: normalizedRef })}
							disabled={!normalizedRef}
						>
							{t("admissions.status.search")}
						</Button>
					</CardContent>
				</Card>

				{statusQuery.isError && (
					<Card>
						<CardContent className="pt-6 text-destructive">
							{statusQuery.error.message}
						</CardContent>
					</Card>
				)}

				{application && checklist && (
					<>
						<Card>
							<CardHeader className="flex flex-row items-start justify-between gap-4">
								<div>
									<CardTitle>
										{statusQuery.data.applicant.firstName}{" "}
										{statusQuery.data.applicant.lastName}
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										{application.program.name} · {application.academicYear.name}
									</p>
								</div>
								<Badge variant={statusVariant}>
									{t(`admissions.statuses.${application.status}`)}
								</Badge>
							</CardHeader>
							<CardContent className="grid gap-3 md:grid-cols-3">
								<Metric
									label={t("admissions.status.missingDocuments")}
									value={checklist.missingRequiredCount}
								/>
								<Metric
									label={t("admissions.status.invalidDocuments")}
									value={checklist.invalidCount}
								/>
								<Metric
									label={t("admissions.status.reference")}
									value={statusQuery.data.applicant.referenceCode}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("admissions.status.checklist")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{checklist.items.length === 0 && (
									<p className="text-muted-foreground text-sm">
										{t("admissions.status.noRequirements")}
									</p>
								)}
								{checklist.items.map((item) => (
									<DocumentRequirement
										key={item.requirement.id}
										item={item}
										applicationId={application.id}
										isSubmitting={submitDocument.isPending}
										onSubmit={(payload) => submitDocument.mutate(payload)}
									/>
								))}
							</CardContent>
						</Card>
					</>
				)}
			</div>
		</div>
	);
}

function Metric({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border bg-muted/30 p-3">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="font-semibold text-lg">{value}</p>
		</div>
	);
}

function DocumentRequirement({
	item,
	applicationId,
	isSubmitting,
	onSubmit,
}: {
	item: NonNullable<
		Awaited<ReturnType<typeof trpcClient.admissions.getStatus.query>>
	>["checklist"]["items"][number];
	applicationId: string;
	isSubmitting: boolean;
	onSubmit: (input: {
		applicationId: string;
		requirementId: string;
		code: string;
		label: string;
		fileName: string;
		fileUrl: string;
	}) => void;
}) {
	const { t } = useTranslation();
	const [fileName, setFileName] = useState(item.document?.fileName ?? "");
	const [fileUrl, setFileUrl] = useState(item.document?.fileUrl ?? "");
	const icon = item.valid ? (
		<CheckCircle2 className="size-4 text-emerald-600" />
	) : item.document?.status === "invalid" ? (
		<XCircle className="size-4 text-destructive" />
	) : (
		<Clock3 className="size-4 text-amber-600" />
	);

	return (
		<div className="rounded-xl border p-4">
			<div className="flex flex-col justify-between gap-3 md:flex-row">
				<div className="space-y-1">
					<div className="flex items-center gap-2 font-medium">
						{icon}
						{item.requirement.label}
						{item.requirement.isRequired && (
							<Badge variant="warning">{t("admissions.status.required")}</Badge>
						)}
					</div>
					{item.requirement.description && (
						<p className="text-muted-foreground text-sm">
							{item.requirement.description}
						</p>
					)}
					{item.document?.reviewNotes && (
						<p className="text-destructive text-sm">
							{item.document.reviewNotes}
						</p>
					)}
				</div>
				<Badge variant={item.valid ? "success" : "outline"}>
					{item.document
						? t(`admissions.documentStatuses.${item.document.status}`)
						: t("admissions.status.missing")}
				</Badge>
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
				<div className="space-y-2">
					<Label>{t("admissions.status.fileName")}</Label>
					<Input
						value={fileName}
						onChange={(event) => setFileName(event.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label>{t("admissions.status.fileUrl")}</Label>
					<Textarea
						value={fileUrl}
						onChange={(event) => setFileUrl(event.target.value)}
						rows={1}
					/>
				</div>
				<div className="flex items-end">
					<Button
						variant="outline"
						disabled={isSubmitting || !fileName || !fileUrl}
						onClick={() =>
							onSubmit({
								applicationId,
								requirementId: item.requirement.id,
								code: item.requirement.code,
								label: item.requirement.label,
								fileName,
								fileUrl,
							})
						}
					>
						<Upload className="mr-2 size-4" />
						{t("admissions.status.submitDocument")}
					</Button>
				</div>
			</div>
		</div>
	);
}
