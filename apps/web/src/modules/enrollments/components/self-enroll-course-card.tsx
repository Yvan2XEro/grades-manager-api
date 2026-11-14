import { motion } from "framer-motion";
import { BookOpen, PlusCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { staggerItem } from "@/lib/animations";
import type { RouterOutputs } from "@/utils/trpc";

interface SelfEnrollCourseCardProps {
	course: RouterOutputs["classCourses"]["list"]["items"][number];
	enrolled: boolean;
	/** Enrollment window open: the student can enroll / unenroll. */
	windowOpen: boolean;
	busy: boolean;
	onEnroll: () => void;
	onUnenroll: () => void;
}

/** One class course of the student, with its enroll / unenroll action. */
export function SelfEnrollCourseCard({
	course,
	enrolled,
	windowOpen: openWindow,
	busy,
	onEnroll,
	onUnenroll,
}: SelfEnrollCourseCardProps) {
	const { t } = useTranslation();
	return (
		<motion.div
			key={course.id}
			variants={staggerItem}
			className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-colors ${
				enrolled ? "border-primary/30 bg-primary/5" : "border-border bg-card"
			}`}
		>
			<div
				className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
					enrolled
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground"
				}`}
			>
				<BookOpen className="h-4 w-4" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-semibold text-foreground text-sm">
						{course.name}
					</span>
					{course.code && (
						<span className="font-mono text-muted-foreground text-xs">
							{course.code}
						</span>
					)}
					{enrolled && (
						<Badge variant="success" className="text-xs">
							{t("student.enrollments.enrolled")}
						</Badge>
					)}
				</div>
				{course.coefficient !== undefined && (
					<p className="mt-0.5 text-muted-foreground text-xs">
						Coeff. {course.coefficient}
					</p>
				)}
			</div>
			{openWindow ? (
				enrolled ? (
					<Button
						size="sm"
						variant="outline"
						className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/5"
						disabled={busy}
						onClick={onUnenroll}
					>
						<XCircle className="mr-1 h-3.5 w-3.5" />
						{t("student.enrollments.unenroll")}
					</Button>
				) : (
					<Button
						size="sm"
						className="shrink-0"
						disabled={busy}
						onClick={onEnroll}
					>
						<PlusCircle className="mr-1 h-3.5 w-3.5" />
						{t("student.enrollments.enroll")}
					</Button>
				)
			) : (
				<span className="shrink-0 text-muted-foreground text-xs">
					{enrolled ? t("student.enrollments.enrolled") : "—"}
				</span>
			)}
		</motion.div>
	);
}
