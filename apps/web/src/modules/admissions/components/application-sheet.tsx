import { CheckCircle2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useApplicationReview } from "../hooks/use-application-review";
import { getDossierSections } from "../services/application-dossier";
import { isAwaitingDecision } from "../services/application-status";
import { ApplicationDossierCompact } from "./application-dossier-compact";
import { ApplicationDrawerConvert } from "./application-drawer-convert";
import { ApplicationDrawerDocuments } from "./application-drawer-documents";
import { ApplicationStatusBadge } from "./application-status-badge";
import { DrawerSection } from "./drawer-section";
import { ReviewDecisionForm } from "./review-decision-form";

/** Review of one application: its file, documents, decision and conversion. */
function ApplicationDrawer({ id }: { id: string | null }) {
	const { t } = useTranslation();
	const review = useApplicationReview(id);
	const { app: selected, isLoading, programs } = review;

	if (isLoading || !selected) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const ap = selected.applicant;
	return (
		<div className="px-6">
			<div className="space-y-0 pb-10">
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
						<ApplicationStatusBadge
							status={
								selected.convertedStudentId ? "converted" : selected.status
							}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="mt-2 w-full gap-2"
						asChild
					>
						<Link to={`/admissions/${selected.id}`}>
							<ExternalLink className="size-3.5" />
							{t("admissions.admin.fullDossier")}
						</Link>
					</Button>
				</SheetHeader>

				<div className="space-y-6 pt-5">
					<ApplicationDossierCompact
						sections={getDossierSections(selected, programs, t)}
					/>

					<ApplicationDrawerDocuments review={review} />

					{!selected.convertedStudentId &&
						isAwaitingDecision(selected.status) && (
							<DrawerSection title={t("admissions.admin.reviewTitle")}>
								<ReviewDecisionForm
									status={selected.status}
									review={review}
									compact
								/>
							</DrawerSection>
						)}

					{selected.status === "accepted" && !selected.convertedStudentId && (
						<ApplicationDrawerConvert review={review} />
					)}

					{selected.convertedStudentId && (
						<div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-700 text-sm dark:text-emerald-400">
							<CheckCircle2 className="mb-1 size-5" />
							{t("admissions.admin.converted")}
						</div>
					)}

					{selected.reviewNotes && (
						<DrawerSection title={t("admissions.admin.reviewNotes")}>
							<p className="rounded-lg bg-muted/40 p-3 text-sm">
								{selected.reviewNotes}
							</p>
						</DrawerSection>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Side drawer reviewing the selected application of the list. Its content is
 * keyed by id so the decision form starts empty for each application.
 */
export function ApplicationSheet({
	id,
	onClose,
}: {
	id: string | null;
	onClose: () => void;
}) {
	return (
		<Sheet
			open={!!id}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<SheetContent
				className="w-full overflow-y-auto sm:max-w-2xl"
				side="right"
			>
				<ApplicationDrawer key={id ?? ""} id={id} />
			</SheetContent>
		</Sheet>
	);
}
