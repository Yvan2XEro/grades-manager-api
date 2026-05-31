import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	BookOpen,
	CheckCircle2,
	Info,
	Lock,
	PlusCircle,
	XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "../../utils/trpc";

export default function CourseEnrollment() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const studentQuery = useQuery(trpc.students.me.queryOptions());
	const studentId = studentQuery.data?.id ?? "";
	const classId = studentQuery.data?.class ?? "";

	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

	const classCoursesQuery = useQuery({
		queryKey: ["class-courses-student", classId],
		enabled: Boolean(classId),
		queryFn: () => trpcClient.classCourses.list.query({ classId, limit: 200 }),
	});

	const myEnrollmentsQuery = useQuery({
		queryKey: ["my-course-enrollments", studentId],
		enabled: Boolean(studentId),
		queryFn: () =>
			trpcClient.studentCourseEnrollments.list.query({ studentId, limit: 200 }),
	});

	const enrollMutation = useMutation({
		mutationFn: (classCourseId: string) =>
			trpcClient.workflows.studentSelfEnroll.mutate({ classCourseId }),
		onSuccess: () => {
			toast.success(t("student.enrollments.enrolled"));
			queryClient.invalidateQueries({
				queryKey: ["my-course-enrollments", studentId],
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const unenrollMutation = useMutation({
		mutationFn: (classCourseId: string) =>
			trpcClient.workflows.studentSelfUnenroll.mutate({ classCourseId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["my-course-enrollments", studentId],
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const openWindow = windowsQuery.data?.find(
		(w) => w.classId === classId && w.status === "open",
	);

	const enrolledIds = new Set(
		(myEnrollmentsQuery.data?.items ?? [])
			.filter((e) => e.status !== "withdrawn")
			.map((e) => e.classCourseId),
	);

	const courses = classCoursesQuery.data?.items ?? [];

	const isLoading =
		studentQuery.isPending ||
		classCoursesQuery.isPending ||
		myEnrollmentsQuery.isPending;

	const busy = enrollMutation.isPending || unenrollMutation.isPending;

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("student.enrollments.title")}
				description={t("student.enrollments.subtitle")}
			/>

			{/* Window status banner */}
			{!windowsQuery.isPending && (
				<div
					className={`flex items-center gap-3 rounded-xl border p-4 ${
						openWindow
							? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
							: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
					}`}
				>
					{openWindow ? (
						<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
					) : (
						<Lock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
					)}
					<div>
						<p
							className={`font-semibold text-sm ${openWindow ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}
						>
							{openWindow
								? t("student.enrollments.windowOpen")
								: t("student.enrollments.windowClosed")}
						</p>
						<p
							className={`text-xs ${openWindow ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
						>
							{openWindow
								? t("student.enrollments.windowOpenHint")
								: t("student.enrollments.windowClosedHint")}
						</p>
					</div>
				</div>
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

					{courses.map((course) => {
						const enrolled = enrolledIds.has(course.id);
						return (
							<motion.div
								key={course.id}
								variants={staggerItem}
								className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-colors ${
									enrolled
										? "border-primary/30 bg-primary/5"
										: "border-border bg-card"
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
											onClick={() => unenrollMutation.mutate(course.id)}
										>
											<XCircle className="mr-1 h-3.5 w-3.5" />
											{t("student.enrollments.unenroll")}
										</Button>
									) : (
										<Button
											size="sm"
											className="shrink-0"
											disabled={busy}
											onClick={() => enrollMutation.mutate(course.id)}
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
					})}
				</motion.div>
			)}
		</div>
	);
}
