import { useTranslation } from "react-i18next";
import type { DossierSection } from "../services/application-dossier";
import { DrawerSection, Info, InfoGrid } from "./drawer-section";

function SectionGroups({ section }: { section: DossierSection }) {
	const { t } = useTranslation();
	if (section.emptyText) {
		return <p className="text-muted-foreground text-sm">{section.emptyText}</p>;
	}
	const groups = section.groups.filter((group) => group.when !== false);
	const grids = groups.map((group, index) => (
		<InfoGrid key={index}>
			{group.fields
				.filter((field) => !field.optional || field.value)
				.map((field) => (
					<Info
						key={field.label}
						label={field.label}
						value={field.value ?? "—"}
						wide={field.wide}
					/>
				))}
		</InfoGrid>
	));
	if (section.groups.length === 1) {
		return (
			<>
				{grids}
				{section.personalStatement && (
					<div className="mt-3 rounded-lg bg-muted/40 p-3">
						<p className="mb-1 text-muted-foreground text-xs">
							{t("admissions.fields.personalStatement")}
						</p>
						<p className="text-sm leading-relaxed">
							{section.personalStatement}
						</p>
					</div>
				)}
			</>
		);
	}
	return (
		<div className="space-y-3">
			{grids}
			{groups.length === 0 && (
				<p className="text-muted-foreground text-sm">—</p>
			)}
		</div>
	);
}

/** The applicant's file in the review drawer: one titled grid per section. */
export function ApplicationDossierCompact({
	sections,
}: {
	sections: DossierSection[];
}) {
	return (
		<>
			{sections.map((section) => (
				<DrawerSection key={section.key} title={section.title}>
					<SectionGroups section={section} />
				</DrawerSection>
			))}
		</>
	);
}
