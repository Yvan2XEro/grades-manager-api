import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { DocumentRequirementCard } from "../components/document-requirement-card";
import { StatusMetric } from "../components/status-metric";
import { useApplicationStatus } from "../hooks/use-application-status";

/** Public page where an applicant follows their application and sends documents. */
export default function ApplicationStatusPage() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const [referenceCode, setReferenceCode] = useState(
		searchParams.get("ref") ?? "",
	);
	const normalizedRef = referenceCode.trim().toUpperCase();
	const { statusQuery, application, checklist, statusVariant, submitDocument } =
		useApplicationStatus(normalizedRef);

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
								<StatusMetric
									label={t("admissions.status.missingDocuments")}
									value={checklist.missingRequiredCount}
								/>
								<StatusMetric
									label={t("admissions.status.invalidDocuments")}
									value={checklist.invalidCount}
								/>
								<StatusMetric
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
									<DocumentRequirementCard
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
