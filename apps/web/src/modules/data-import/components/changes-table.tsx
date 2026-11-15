import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { G } from "../services/import-steps";
import type { RowChange } from "../types";

/** What the import will create or update, row by row: before → after. */
export function ChangesTable({
	changes,
	total,
}: {
	changes: RowChange[];
	total: number;
}) {
	const { t } = useTranslation();
	if (!changes.length)
		return (
			<p className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
				{t(`${G}changes.none`)}
			</p>
		);
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
			<div className="min-h-0 flex-1 overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-card">
						<TableRow>
							<TableHead className="w-32">{t(`${G}issues.sheet`)}</TableHead>
							<TableHead className="w-16">{t(`${G}issues.row`)}</TableHead>
							<TableHead className="w-28">{t(`${G}changes.action`)}</TableHead>
							<TableHead className="w-64">{t(`${G}changes.what`)}</TableHead>
							<TableHead>{t(`${G}changes.values`)}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{changes.map((change) => (
							<TableRow key={`${change.sheet}-${change.row}-${change.label}`}>
								<TableCell>{change.sheet}</TableCell>
								<TableCell className="tabular-nums">{change.row}</TableCell>
								<TableCell>
									<Badge
										variant={
											change.action === "create" ? "default" : "secondary"
										}
									>
										{t(`${G}changes.${change.action}`)}
									</Badge>
								</TableCell>
								<TableCell className="font-medium">{change.label}</TableCell>
								<TableCell>
									<ul className="space-y-0.5 text-xs">
										{Object.entries(change.after).map(([field, value]) => (
											<li
												key={field}
												className="flex flex-wrap items-center gap-1"
											>
												<span className="text-muted-foreground">{field} :</span>
												{change.before && (
													<>
														<span className="line-through opacity-60">
															{change.before[field] || "—"}
														</span>
														<ArrowRight className="h-3 w-3" />
													</>
												)}
												<span>{value || "—"}</span>
											</li>
										))}
									</ul>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{total > changes.length && (
				<p className="border-t px-3 py-2 text-muted-foreground text-xs">
					{t(`${G}changes.truncated`, { shown: changes.length, total })}
				</p>
			)}
		</div>
	);
}
