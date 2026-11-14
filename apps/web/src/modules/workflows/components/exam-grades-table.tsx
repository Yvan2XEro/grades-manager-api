import { Hash } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { RouterOutputs } from "@/utils/trpc";

type Grade = RouterOutputs["grades"]["listByExam"]["items"][number];

/** Grades of one exam, shown when an approval card is expanded. */
export function ExamGradesTable({ grades }: { grades: Grade[] }) {
	const { t } = useTranslation();
	return (
		<div className="max-h-72 overflow-y-auto rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-28">
							<span className="flex items-center gap-1">
								<Hash className="h-3 w-3" />
								{t("dean.approvals.regNumber")}
							</span>
						</TableHead>
						<TableHead>{t("dean.approvals.student")}</TableHead>
						<TableHead className="w-20 text-right">
							{t("dean.approvals.score")}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{grades.map((g) => (
						<TableRow key={g.id}>
							<TableCell className="font-mono text-muted-foreground text-xs">
								{(g as any).registrationNumber ?? "—"}
							</TableCell>
							<TableCell className="text-sm">
								{(g as any).studentName ?? "—"}
							</TableCell>
							<TableCell
								className={`text-right font-semibold text-sm tabular-nums ${
									Number(g.score) < 10 ? "text-destructive" : "text-foreground"
								}`}
							>
								{Number(g.score).toFixed(2)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
