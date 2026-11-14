import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdmissionDecisionTab } from "../components/admission-decision-tab";
import { AdmissionDetailHeader } from "../components/admission-detail-header";
import { AdmissionDocumentsCard } from "../components/admission-documents-card";
import { AdmissionDossierGrid } from "../components/admission-dossier-grid";
import { useApplicationReview } from "../hooks/use-application-review";
import { getDossierSections } from "../services/application-dossier";

/** Full page of one application: file, documents and decision tabs. */
export default function AdmissionDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const review = useApplicationReview(id);
	const { app, isLoading, checklist, programs } = review;
	const ap = app?.applicant;

	if (isLoading) {
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
					<Link to="/admissions">
						<ArrowLeft className="mr-2 size-4" />
						{t("common.back")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<AdmissionDetailHeader app={app} />

			<Tabs defaultValue="dossier">
				<TabsList>
					<TabsTrigger value="dossier">
						{t("admissions.admin.tabs.dossier")}
					</TabsTrigger>
					<TabsTrigger value="documents">
						{t("admissions.admin.tabs.documents")}
						{checklist?.missingRequiredCount ? (
							<span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
								{checklist.missingRequiredCount}
							</span>
						) : null}
					</TabsTrigger>
					<TabsTrigger value="decision">
						{t("admissions.admin.tabs.decision")}
					</TabsTrigger>
				</TabsList>

				{/* ── Dossier complet ── */}
				<TabsContent value="dossier" className="space-y-5 pt-4">
					<AdmissionDossierGrid
						sections={getDossierSections(app, programs, t)}
					/>
				</TabsContent>

				<TabsContent value="documents" className="pt-4">
					<AdmissionDocumentsCard review={review} />
				</TabsContent>

				<TabsContent value="decision" className="space-y-5 pt-4">
					<AdmissionDecisionTab app={app} review={review} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
