import { motion } from "framer-motion";
import { BookOpen, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer } from "@/lib/animations";

import { SelfEnrollCourseCard } from "../components/self-enroll-course-card";
import { SelfEnrollmentWindowBanner } from "../components/self-enrollment-window-banner";
import { useMyCourseEnrollments } from "../hooks/use-my-course-enrollments";

/** Self-enrollment of a student in the courses of their class. */
export default function CourseEnrollmentPage() {
	const { t } = useTranslation();
	const {
		windowsQuery,
		openWindow,
		enrolledIds,
		courses,
		isLoading,
		busy,
		enrollMutation,
		unenrollMutation,
	} = useMyCourseEnrollments();

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("student.enrollments.title")}
				description={t("student.enrollments.subtitle")}
			/>

			{/* Window status banner */}
			{!windowsQuery.isPending && (
				<SelfEnrollmentWindowBanner open={Boolean(openWindow)} />
			)}

			{isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : courses.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
					<BookOpen className="h-8 w-8 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("student.enrollments.noCourses")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("student.enrollments.noCoursesHint")}
						</p>
					</div>
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="space-y-3"
				>
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Info className="h-4 w-4" />
						<span>
							{enrolledIds.size} / {courses.length}{" "}
							{t("student.enrollments.enrolled").toLowerCase()}
						</span>
					</div>

					{courses.map((course) => (
						<SelfEnrollCourseCard
							key={course.id}
							course={course}
							enrolled={enrolledIds.has(course.id)}
							windowOpen={Boolean(openWindow)}
							busy={busy}
							onEnroll={() => enrollMutation.mutate(course.id)}
							onUnenroll={() => unenrollMutation.mutate(course.id)}
						/>
					))}
				</motion.div>
			)}
		</div>
	);
}
