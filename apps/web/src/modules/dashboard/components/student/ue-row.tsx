import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { scoreBadge } from "../../services/score-styles";
import type { UEData } from "../../types";

export function UERow({ unit }: { unit: UEData }) {
	const [open, setOpen] = useState(false);
	const validated = unit.average >= 10;

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<button
				type="button"
				className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
				onClick={() => setOpen((p) => !p)}
			>
				<div
					className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${scoreBadge(unit.average)}`}
				>
					{unit.average.toFixed(1)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="truncate font-semibold text-foreground text-sm">
							{unit.name}
						</span>
						{unit.code && (
							<span className="font-mono text-muted-foreground text-xs">
								{unit.code}
							</span>
						)}
						{validated ? (
							<Badge variant="success" className="text-xs">
								Validé
							</Badge>
						) : (
							<Badge variant="destructive" className="text-xs">
								Non validé
							</Badge>
						)}
					</div>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{unit.credits} crédit{unit.credits !== 1 ? "s" : ""}
						{" · "}
						{unit.courses.length} cours
					</p>
				</div>
				<div className="shrink-0 text-muted-foreground">
					{open ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</div>
			</button>

			{open && (
				<div className="border-t bg-muted/10">
					{unit.courses.map((course) => (
						<div
							key={course.id}
							className="flex items-center justify-between border-b px-4 py-2.5 last:border-0"
						>
							<div>
								<p className="font-medium text-foreground text-sm">
									{course.name}
								</p>
								<p className="text-muted-foreground text-xs">
									Coeff. {course.coefficient}
								</p>
							</div>
							<span
								className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-semibold text-sm tabular-nums ${scoreBadge(course.average)}`}
							>
								{course.average.toFixed(2)}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
