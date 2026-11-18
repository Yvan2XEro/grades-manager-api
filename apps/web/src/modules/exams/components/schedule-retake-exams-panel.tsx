import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ScheduleExamsState } from "../hooks/use-exam-scheduler";
import type { SchedulerRetakeExam } from "../types";

interface ScheduleRetakeExamsPanelProps {
	exams: SchedulerRetakeExam[];
	isLoading: boolean;
	selection: ScheduleExamsState["examSelection"];
}

/** Exams of a retake session, all selected by default. */
export function ScheduleRetakeExamsPanel({
	exams,
	isLoading,
	selection,
}: ScheduleRetakeExamsPanelProps) {
	const { t } = useTranslation();
	return (
		<>
			<div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
				<div>
					<p className="font-medium text-sm">
						{t("admin.examScheduler.retakeExams.title")}
					</p>
					<p className="text-muted-foreground text-xs">
						{t("admin.examScheduler.retakeExams.description")}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Badge variant="secondary" className="text-xs">
						{t("admin.examScheduler.retakeExams.examCount", {
							count: exams.length,
						})}
					</Badge>
					<div className="flex items-center gap-2">
						<Checkbox
							id="select-all-exams"
							checked={selection.allSelected}
							onCheckedChange={(value) => selection.setAll(value === true)}
							disabled={!exams.length}
						/>
						<Label htmlFor="select-all-exams" className="text-sm">
							{t("admin.examScheduler.retakeExams.selectAll")}
						</Label>
					</div>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spinner />
					</div>
				) : !exams.length ? (
					<div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
						{t("admin.examScheduler.retakeExams.noExams")}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12" />
								<TableHead>
									{t("admin.examScheduler.history.details.table.exam")}
								</TableHead>
								<TableHead>
									{t("admin.examScheduler.history.details.table.course")}
								</TableHead>
								<TableHead>
									{t("admin.examScheduler.history.details.table.class")}
								</TableHead>
								<TableHead>
									{t("admin.examScheduler.history.details.table.type")}
								</TableHead>
								<TableHead>
									{t("admin.examScheduler.history.details.table.date")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{exams.map((exam) => (
								<TableRow key={exam.id}>
									<TableCell>
										<Checkbox
											checked={selection.selected.has(exam.id)}
											onCheckedChange={() => selection.toggle(exam.id)}
										/>
									</TableCell>
									<TableCell className="font-medium">{exam.name}</TableCell>
									<TableCell>{exam.courseName}</TableCell>
									<TableCell>{exam.className}</TableCell>
									<TableCell>
										<Badge variant="outline">{exam.type}</Badge>
									</TableCell>
									<TableCell>{format(new Date(exam.date), "PP")}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</>
	);
}
