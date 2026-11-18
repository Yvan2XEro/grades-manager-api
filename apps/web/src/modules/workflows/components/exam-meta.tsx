import { BookOpen, Calendar, Tag, Users } from "lucide-react";
import { formatShortDate } from "../services/exam-format";

export function ExamTypeTag({ type }: { type: string | null | undefined }) {
	if (!type) return null;
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs">
			<Tag className="h-3 w-3" />
			{type}
		</span>
	);
}

/** Course, class and date of an exam, on one wrapping line. */
export function ExamMetaLine({
	exam,
}: {
	exam: {
		courseName: string | null;
		courseCode: string | null;
		className: string | null;
		date: Date | string | null;
	};
}) {
	const examDate = formatShortDate(exam.date);
	return (
		<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
			{exam.courseName && (
				<span className="flex items-center gap-1">
					<BookOpen className="h-3 w-3 shrink-0" />
					{exam.courseName}
					{exam.courseCode && (
						<span className="font-mono">({exam.courseCode})</span>
					)}
				</span>
			)}
			{exam.className && (
				<span className="flex items-center gap-1">
					<Users className="h-3 w-3 shrink-0" />
					{exam.className}
				</span>
			)}
			{examDate && (
				<span className="flex items-center gap-1">
					<Calendar className="h-3 w-3 shrink-0" />
					{examDate}
				</span>
			)}
		</div>
	);
}
