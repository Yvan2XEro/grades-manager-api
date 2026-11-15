import { CalendarPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { G, YEAR_STEPS, yearProgress } from "../services/import-steps";
import type { ImportYear } from "../types";
import { useManualEntry } from "./manual-entry";

/** Each academic year with what it already contains, oldest first. */
export function AcademicYearsCard({
	years,
	foundationsReady,
}: {
	years: ImportYear[];
	foundationsReady: boolean;
}) {
	const { t } = useTranslation();
	const openManual = useManualEntry();
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-1">
					<CardTitle className="text-base">{t(`${G}years.title`)}</CardTitle>
					<p className="text-muted-foreground text-sm">{t(`${G}years.text`)}</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="shrink-0"
					onClick={() => openManual("year")}
				>
					<CalendarPlus className="mr-2 h-4 w-4" />
					{t(`${G}years.add`)}
				</Button>
			</CardHeader>
			<CardContent className="space-y-2">
				{!foundationsReady && (
					<p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400">
						{t(`${G}years.foundationsFirst`)}
					</p>
				)}
				{years.length === 0 && (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{t(`${G}years.empty`)}
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
									{year.isActive && (
										<Badge variant="secondary">{t(`${G}years.active`)}</Badge>
									)}
									<span className="text-muted-foreground text-xs">
										{progress}/{YEAR_STEPS.length}
									</span>
								</div>
							</div>
							<ol className="flex flex-1 flex-wrap gap-2">
								{YEAR_STEPS.map((step, index) => {
									const count = year.counts[step.count];
									const label = t(`${G}yearSteps.${step.key}`);
									return (
										<li key={step.key}>
											<span
												className={cn(
													"flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
													count > 0
														? "border-primary/40 bg-primary/5 text-primary"
														: "text-muted-foreground",
												)}
												title={`${label} : ${count}`}
											>
												<span className="font-semibold">{index + 1}</span>
												{label}
												<span className="tabular-nums opacity-70">{count}</span>
											</span>
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
