import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ApplicationReview } from "../hooks/use-application-review";
import { DrawerSection } from "./drawer-section";

/** Document checklist of the review drawer, each file marked valid / invalid. */
export function ApplicationDrawerDocuments({
	review: { checklist, checklistLoading, reviewDocument },
}: {
	review: ApplicationReview;
}) {
	const { t } = useTranslation();
	const onReviewDocument = (id: string, status: "valid" | "invalid") =>
		reviewDocument.mutate({ id, status });
	return (
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
							<p className="font-medium text-sm">{item.requirement.label}</p>
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
									item.document && onReviewDocument(item.document.id, "valid")
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
									item.document && onReviewDocument(item.document.id, "invalid")
								}
							>
								<XCircle className="size-3" />
							</Button>
						</div>
					</div>
				))}
			</div>
		</DrawerSection>
	);
}
