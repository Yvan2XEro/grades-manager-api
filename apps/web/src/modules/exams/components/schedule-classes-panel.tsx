import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { ScheduleExamsState } from "../hooks/use-exam-scheduler";
import type { PreviewClass } from "../types";

interface ScheduleClassesPanelProps {
	classes: PreviewClass[];
	isLoading: boolean;
	selection: ScheduleExamsState["classSelection"];
}

/** Classes of a normal session, all selected by default. */
export function ScheduleClassesPanel({
	classes,
	isLoading,
	selection,
}: ScheduleClassesPanelProps) {
	const { t } = useTranslation();
	return (
		<>
			<div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
				<div>
					<p className="font-medium text-sm">
						{t("admin.examScheduler.classes.title")}
					</p>
					<p className="text-muted-foreground text-xs">
						{t("admin.examScheduler.classes.description")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id="select-all-classes"
						checked={selection.allSelected}
						onCheckedChange={(value) => selection.setAll(value === true)}
						disabled={!classes.length}
					/>
					<Label htmlFor="select-all-classes" className="text-sm">
						{t("admin.examScheduler.classes.selectAll")}
					</Label>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spinner />
					</div>
				) : !classes.length ? (
					<div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
						{t("admin.examScheduler.classes.description")}
					</div>
				) : (
					<div className="space-y-2">
						{classes.map((klass) => (
							<div
								key={klass.id}
								onClick={() => selection.toggle(klass.id)}
								className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
									selection.selected.has(klass.id)
										? "border-primary/40 bg-primary/5"
										: "border-border hover:bg-muted/50"
								}`}
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-sm">{klass.name}</p>
									<p className="truncate text-muted-foreground text-xs">
										{klass.programName}
									</p>
								</div>
								<div className="ml-3 flex shrink-0 items-center gap-3">
									<Badge variant="outline" className="text-xs">
										{klass.classCourseCount} {t("admin.exams.table.course")}
									</Badge>
									<Checkbox
										checked={selection.selected.has(klass.id)}
										onCheckedChange={() => selection.toggle(klass.id)}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
}
