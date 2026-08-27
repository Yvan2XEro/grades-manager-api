import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OfficialExamsList() {
	const { t } = useTranslation();

	const EXAM_TYPES = ["BEPC", "CAP", "PROBATOIRE", "BAC"];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("official_exams.title", "Examens officiels")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"official_exams.subtitle",
							"Candidatures aux examens officiels (BEPC, BAC, CAP…)",
						)}
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{EXAM_TYPES.map((exam) => (
					<div
						key={exam}
						className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
					>
						<div className="flex items-center gap-2">
							<ClipboardList className="h-5 w-5 text-primary" />
							<span className="font-semibold text-card-foreground">{exam}</span>
						</div>
						<p className="font-bold text-2xl text-card-foreground">—</p>
						<p className="text-muted-foreground text-xs">
							{t("official_exams.candidates", "candidats")}
						</p>
					</div>
				))}
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-4 py-3">
					<h2 className="font-semibold text-foreground text-sm">
						{t("official_exams.sessions", "Sessions d'examens")}
					</h2>
				</div>
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<ClipboardList className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("official_exams.no_sessions", "Aucune session configurée")}
					</p>
					<p className="text-xs">
						{t(
							"official_exams.setup_hint",
							"Créez une session d'examen pour inscrire les candidats.",
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
