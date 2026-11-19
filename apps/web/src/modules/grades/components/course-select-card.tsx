import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

/** Picker of the class course whose grades are entered. */
export function CourseSelectCard({
	courseId,
	classCourses,
	isLoading,
	canSeeAllCourses,
	onChange,
}: {
	courseId: string;
	classCourses: Array<{
		id: string;
		code: string;
		course: string;
		courseName?: string | null;
		className?: string | null;
	}>;
	isLoading: boolean;
	/** Admins see every course: their empty state is not "none assigned". */
	canSeeAllCourses: boolean;
	onChange: (value: string) => void;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardContent className="space-y-3">
				<div className="space-y-2">
					<Label htmlFor="class-course">
						{t("teacher.gradeEntry.selectCourse.label")}
					</Label>
					<Select
						value={courseId || undefined}
						onValueChange={onChange}
						disabled={classCourses.length === 0}
					>
						<SelectTrigger id="class-course" data-testid="class-course-select">
							<SelectValue
								placeholder={t("teacher.gradeEntry.selectCourse.empty")}
							/>
						</SelectTrigger>
						<SelectContent>
							{classCourses.map((cc) => (
								<SelectItem key={cc.id} value={cc.id}>
									{cc.courseName ?? cc.course}
									{cc.className ? ` — ${cc.className}` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{classCourses.length === 0 && !isLoading ? (
						<p className="text-muted-foreground text-xs">
							{canSeeAllCourses
								? t("teacher.gradeEntry.selectCourse.emptyStateAdmin")
								: t("teacher.gradeEntry.selectCourse.emptyState")}
						</p>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
