import { FileSpreadsheet, Loader2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/date-format";
import type { ExamSelection } from "../hooks/use-exam-selection";
import type { ExamItem, ExamSort } from "../types";
import { StepBadge } from "./export-ui";

/** Step 2 — exams of the class grouped by course, with checkboxes. */
export function ExamSelectionCard({
	exams,
	isLoading,
	selection,
	onSortChange,
}: {
	exams: ExamItem[] | undefined;
	isLoading: boolean;
	selection: ExamSelection;
	onSortChange: (value: ExamSort) => void;
}) {
	const { t } = useTranslation();

	return isLoading ? (
		<Card>
			<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="font-medium text-sm">
					{t("admin.gradeExport.exams.loadingTitle")}
				</p>
				<p className="text-muted-foreground text-xs">
					{t("admin.gradeExport.exams.loadingDescription")}
				</p>
			</CardContent>
		</Card>
	) : exams && exams.length > 0 ? (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<CardTitle className="flex items-center gap-3 text-base">
							<StepBadge step={2} />
							{t("admin.gradeExport.exams.title")}
						</CardTitle>
						<CardDescription>
							{t("admin.gradeExport.exams.selectedCount", {
								selected: selection.selectedExams.length,
								count: exams.length,
							})}
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={selection.selectAll}
							disabled={selection.selectedExams.length === exams.length}
						>
							{t("common.actions.selectAll")}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={selection.deselectAll}
							disabled={selection.selectedExams.length === 0}
						>
							{t("common.actions.deselectAll")}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-3">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("admin.gradeExport.exams.searchPlaceholder")}
							value={selection.searchQuery}
							onChange={(e) => selection.setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select
						value={selection.sortBy}
						onValueChange={(value) => onSortChange(value as ExamSort)}
					>
						<SelectTrigger className="w-44">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="course">
								{t("admin.gradeExport.exams.sort.course")}
							</SelectItem>
							<SelectItem value="date">
								{t("admin.gradeExport.exams.sort.date")}
							</SelectItem>
							<SelectItem value="type">
								{t("admin.gradeExport.exams.sort.type")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{selection.filteredAndSortedCourses.length > 0 ? (
					<Accordion type="multiple" className="w-full">
						{selection.filteredAndSortedCourses.map(
							([courseKey, courseExams]) => {
								const courseSelectedCount = courseExams.filter((e) =>
									selection.selectedExams.includes(e.id),
								).length;
								const allCourseSelected =
									courseSelectedCount === courseExams.length;

								return (
									<AccordionItem key={courseKey} value={courseKey}>
										<div className="flex items-center gap-2">
											<Checkbox
												checked={allCourseSelected}
												onCheckedChange={() =>
													selection.toggleCourse(courseExams)
												}
												className="ml-4"
											/>
											<AccordionTrigger className="flex-1 hover:no-underline">
												<div className="flex flex-1 items-center gap-3">
													<div className="flex-1 text-left">
														<div className="font-medium">
															{courseExams[0].courseName}
															{courseExams[0].courseCode && (
																<span className="ml-2 font-normal text-muted-foreground">
																	({courseExams[0].courseCode})
																</span>
															)}
														</div>
														<div className="text-muted-foreground text-xs">
															{t("admin.gradeExport.exams.courseCount", {
																selected: courseSelectedCount,
																count: courseExams.length,
															})}
														</div>
													</div>
													<Badge
														variant={
															allCourseSelected ? "default" : "secondary"
														}
													>
														{courseExams.length}
													</Badge>
												</div>
											</AccordionTrigger>
										</div>
										<AccordionContent>
											<div className="space-y-2 pt-2 pl-9">
												{courseExams.map((exam) => (
													<div
														key={exam.id}
														className="flex items-start gap-3 rounded-lg border px-3 py-2 hover:bg-accent"
													>
														<Checkbox
															id={`exam-${exam.id}`}
															checked={selection.selectedExams.includes(
																exam.id,
															)}
															onCheckedChange={(checked) =>
																selection.toggleExam(exam.id, Boolean(checked))
															}
														/>
														<label
															htmlFor={`exam-${exam.id}`}
															className="flex-1 cursor-pointer"
														>
															<div className="font-medium text-sm">
																{exam.name} • {exam.type}
															</div>
															<div className="text-muted-foreground text-xs">
																{formatDate(exam.date)} • {exam.percentage}%
															</div>
														</label>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								);
							},
						)}
					</Accordion>
				) : (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{t("admin.gradeExport.exams.noMatch", {
							query: selection.searchQuery,
						})}
					</p>
				)}
			</CardContent>
		</Card>
	) : (
		<Card>
			<CardContent className="flex flex-col items-center gap-2 py-10 text-center">
				<FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
				<p className="font-medium text-sm">
					{t("admin.gradeExport.exams.emptyTitle")}
				</p>
				<p className="text-muted-foreground text-xs">
					{t("admin.gradeExport.exams.emptyDescription")}
				</p>
			</CardContent>
		</Card>
	);
}
