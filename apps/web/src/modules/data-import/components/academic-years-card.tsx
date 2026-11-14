import { CalendarPlus } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { YEAR_STEPS, yearProgress } from "../services/import-steps";
import type { ImportYear } from "../types";

/** Each academic year with what it already contains, oldest first. */
export function AcademicYearsCard({
	years,
	foundationsReady,
}: {
	years: ImportYear[];
	foundationsReady: boolean;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-1">
					<CardTitle className="text-base">2. Années académiques</CardTitle>
					<p className="text-muted-foreground text-sm">
						Les données de chaque année, de la plus ancienne à la plus récente :
						les promotions et les crédits d'une année dépendent des précédentes.
						L'import guidé de ces étapes arrive dans la prochaine version ; en
						attendant, chaque étape s'ouvre sur sa page de saisie.
					</p>
				</div>
				<Button asChild variant="outline" size="sm" className="shrink-0">
					<Link to="/academic-years">
						<CalendarPlus className="mr-2 h-4 w-4" />
						Ajouter une année
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="space-y-2">
				{!foundationsReady && (
					<p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400">
						Terminez d'abord les fondations : les classes d'une année s'appuient
						sur les programmes et les niveaux.
					</p>
				)}
				{years.length === 0 && (
					<p className="py-6 text-center text-muted-foreground text-sm">
						Aucune année académique. Créez la première pour commencer.
					</p>
				)}
				{years.map((year) => {
					const progress = yearProgress(year);
					return (
						<div
							key={year.id}
							className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border p-4"
						>
							<div className="w-32 shrink-0">
								<p className="font-medium">{year.name}</p>
								<div className="mt-1 flex items-center gap-2">
									{year.isActive && <Badge variant="secondary">Active</Badge>}
									<span className="text-muted-foreground text-xs">
										{progress}/{YEAR_STEPS.length}
									</span>
								</div>
							</div>
							<ol className="flex flex-1 flex-wrap gap-2">
								{YEAR_STEPS.map((step, index) => {
									const count = year.counts[step.count];
									return (
										<li key={step.key}>
											<Link
												to={step.manualPath}
												className={cn(
													"flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted",
													count > 0
														? "border-primary/40 bg-primary/5 text-primary"
														: "text-muted-foreground",
												)}
												title={`${step.label} : ${count}`}
											>
												<span className="font-semibold">{index + 1}</span>
												{step.label}
												<span className="tabular-nums opacity-70">{count}</span>
											</Link>
										</li>
									);
								})}
							</ol>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
