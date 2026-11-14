import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ApplicationReview } from "../hooks/use-application-review";

/** "Documents" tab: each required document with its file and review buttons. */
export function AdmissionDocumentsCard({
	review: { checklist, checklistLoading, reviewDocument },
}: {
	review: ApplicationReview;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<FileCheck2 className="size-4" />
					{t("admissions.admin.documentsTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{checklistLoading && <Spinner />}
				{!checklistLoading && checklist?.items.length === 0 && (
					<p className="text-muted-foreground text-sm">
						{t("admissions.status.noRequirements")}
					</p>
				)}
				{checklist?.items.map((item) => (
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
	);
}
