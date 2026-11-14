import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DossierSection } from "../services/application-dossier";

function DossierCard({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
			</CardContent>
		</Card>
	);
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	if (!value) return null;
	return (
		<div>
			<dt className="text-[10px] text-muted-foreground uppercase tracking-wide">
				{label}
			</dt>
			<dd className="font-medium text-sm">{value}</dd>
		</div>
	);
}

/** "File" tab of the application page: one card per section, empty values hidden. */
export function AdmissionDossierGrid({
	sections,
}: {
	sections: DossierSection[];
}) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-5 lg:grid-cols-2">
			{sections.map((section) => (
				<DossierCard key={section.key} title={section.title}>
					{section.emptyText ? (
						<p className="py-1 text-muted-foreground text-sm">
							{section.emptyText}
						</p>
					) : (
						section.groups
							.filter((group) => group.whenOnPage !== false)
							.flatMap((group) => group.fields)
							.map((field) => (
								<InfoRow
									key={field.label}
									label={field.label}
									value={field.value}
								/>
							))
					)}
					{section.personalStatement && (
						<div className="col-span-2 mt-2 rounded-lg bg-muted/40 p-3">
							<p className="mb-1 text-muted-foreground text-xs">
								{t("admissions.fields.personalStatement")}
							</p>
							<p className="text-sm leading-relaxed">
								{section.personalStatement}
							</p>
						</div>
					)}
				</DossierCard>
			))}
		</div>
	);
}
