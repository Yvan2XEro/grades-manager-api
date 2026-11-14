import {
	ArrowRight,
	FileSpreadsheet,
	ListChecks,
	ShieldCheck,
} from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicYearsCard } from "../components/academic-years-card";
import { FoundationsCard } from "../components/foundations-card";
import { useImportOverview } from "../hooks/use-import-overview";
import { foundationStatus } from "../services/import-steps";

const HOW_IT_WORKS = [
	{
		icon: ListChecks,
		title: "Dans l'ordre",
		text: "D'abord les fondations (une fois), puis chaque année, de la plus ancienne à la plus récente.",
	},
	{
		icon: FileSpreadsheet,
		title: "Un modèle par étape",
		text: "Le modèle Excel est pré-rempli avec vos données et propose les codes connus en listes déroulantes.",
	},
	{
		icon: ShieldCheck,
		title: "Vérifié avant d'enregistrer",
		text: "Chaque fichier est contrôlé ligne par ligne ; vous voyez ce qui sera créé ou modifié avant de valider.",
	},
];

export default function DataImportPage() {
	const { data, isLoading } = useImportOverview();
	const foundationsReady =
		data?.foundations.every((s) => foundationStatus(s) !== "todo") ?? false;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Import des données"
				description="Reprenez l'historique de votre institution étape par étape : la structure académique, puis les données de chaque année."
			/>

			<div className="grid gap-3 md:grid-cols-3">
				{HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
					<div key={title} className="flex gap-3 rounded-lg border bg-card p-4">
						<Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
						<div>
							<p className="font-medium text-sm">{title}</p>
							<p className="text-muted-foreground text-xs">{text}</p>
						</div>
					</div>
				))}
			</div>

			{isLoading || !data ? (
				<Skeleton className="h-96 w-full" />
			) : (
				<>
					<FoundationsCard steps={data.foundations} />
					<AcademicYearsCard
						years={data.years}
						foundationsReady={foundationsReady}
					/>
				</>
			)}

			<Link
				to="/import/legacy"
				className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
			>
				Import avancé (ancien format en un seul fichier)
				<ArrowRight className="h-3 w-3" />
			</Link>
		</div>
	);
}
