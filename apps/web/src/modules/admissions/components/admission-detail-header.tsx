import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { ApplicationDetail } from "../types";
import { ApplicationStatusBadge } from "./application-status-badge";

/** Back link, applicant name, status and program of the application page. */
export function AdmissionDetailHeader({ app }: { app: ApplicationDetail }) {
	const { t } = useTranslation();
	const ap = app.applicant;
	const statusKey = app.convertedStudentId ? "converted" : app.status;
	return (
		<div className="flex items-start gap-4">
			<Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
				<Link to="/admissions">
					<ArrowLeft className="size-4" />
				</Link>
			</Button>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="font-semibold text-2xl">
						{ap.lastName} {ap.firstName}
					</h1>
					<ApplicationStatusBadge status={statusKey} className="px-2.5" />
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
	);
}
