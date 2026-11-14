import { FileSpreadsheet, ListChecks, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicYearsCard } from "../components/academic-years-card";
import { FoundationsCard } from "../components/foundations-card";
import { ProfileCard } from "../components/profile-card";
import { SetupProgress } from "../components/setup-progress";
import { useImportOverview } from "../hooks/use-import-overview";
import { foundationStatus, G, setupMilestones } from "../services/import-steps";

const HOW_IT_WORKS = [
	{ icon: ListChecks, key: "order" },
	{ icon: FileSpreadsheet, key: "template" },
	{ icon: ShieldCheck, key: "checked" },
];

export default function DataImportPage() {
	const { t } = useTranslation();
	const { data, isLoading } = useImportOverview();
	const foundationsReady =
		data?.foundations.every((s) => foundationStatus(s) !== "todo") ?? false;

	return (
		<div className="space-y-6">
			<PageHeader title={t(`${G}title`)} description={t(`${G}description`)} />

			{data && <SetupProgress milestones={setupMilestones(data, t)} />}

			<div className="grid gap-3 md:grid-cols-3">
				{HOW_IT_WORKS.map(({ icon: Icon, key }) => (
					<div key={key} className="flex gap-3 rounded-lg border bg-card p-4">
						<Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
						<div>
							<p className="font-medium text-sm">{t(`${G}how.${key}.title`)}</p>
							<p className="text-muted-foreground text-xs">
								{t(`${G}how.${key}.text`)}
							</p>
						</div>
					</div>
				))}
			</div>

			{isLoading || !data ? (
				<Skeleton className="h-96 w-full" />
			) : (
				<>
					<ProfileCard profile={data.profile} />
					<FoundationsCard steps={data.foundations} />
					<AcademicYearsCard
						years={data.years}
						foundationsReady={foundationsReady}
					/>
				</>
			)}
		</div>
	);
}
