import { BookOpen, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCoursesOfClass } from "../hooks/use-class-courses";
import type { ClassData } from "../types";
import { AssignTeachingUnitDialog } from "./assign-teaching-unit-dialog";

/** Opens the dialog adding a teaching unit's courses to this class. */
export function useAddTeachingUnitCourses(cls: ClassData) {
	const { courses, invalidate } = useCoursesOfClass(cls.id);
	return async () => {
		const added = await AssignTeachingUnitDialog.call({
			existingCodes: courses.map((cc) => cc.code),
			academicYearId: cls.academicYear,
			defaultClass: { id: cls.id, code: cls.code },
		});
		if (added) invalidate();
	};
}

/**
 * Banner of a class without any course: without courses there are no exams,
 * grades or jury, so it says so and offers to add them in place.
 */
export function ClassNoCoursesHint({ cls }: { cls: ClassData }) {
	const { t } = useTranslation();
	const { courses, isLoading } = useCoursesOfClass(cls.id);
	const addCourses = useAddTeachingUnitCourses(cls);
	if (isLoading || courses.length > 0) return null;
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
			<div className="flex items-start gap-3">
				<BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
				<div className="text-sm">
					<p className="font-medium text-amber-900 dark:text-amber-200">
						{t("admin.classes.noCoursesHint.title")}
					</p>
					<p className="text-amber-800 text-xs dark:text-amber-300">
						{t("admin.classes.noCoursesHint.description")}
					</p>
				</div>
			</div>
			<Button size="sm" onClick={addCourses}>
				<Plus className="mr-1.5 h-4 w-4" />
				{t("admin.classes.noCoursesHint.action")}
			</Button>
		</div>
	);
}
