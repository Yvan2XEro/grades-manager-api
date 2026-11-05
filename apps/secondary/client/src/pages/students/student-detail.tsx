import { BookOpen, Plus, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { cn } from "@/lib/utils";
import { EnrollStudentDialog } from "@/pages/enrollments/enroll-student-dialog";
import { trpc } from "@/utils/trpc";

function DetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="space-y-1">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-32" />
			</div>
			<div className="flex gap-4 border-border border-b pb-px">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-8 w-20" />
				))}
			</div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div className="space-y-5 rounded-xl border border-border p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
				<div className="space-y-5 rounded-xl border border-border p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-36" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function StudentDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const TAB_NAV = [
		{
			to: `/students/${id}/profile`,
			label: "students.tab_profile",
			fallback: "Profile",
		},
		{
			to: `/students/${id}/grades`,
			label: "students.tab_grades",
			fallback: "Grades",
		},
		{
			to: `/students/${id}/fees`,
			label: "students.tab_fees",
			fallback: "Fees",
		},
		{
			to: `/students/${id}/attendance`,
			label: "students.tab_attendance",
			fallback: "Attendance",
		},
	];

	const { data: student, isLoading } = trpc.students.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("nav.students", "Students"), href: "/students" },
		{
			label: student ? `${student.lastName} ${student.firstName}` : "...",
		},
	]);

	const { data: enrollmentHistory = [] } =
		trpc.enrollments.listByStudent.useQuery(
			{ studentId: student?.id ?? "" },
			{ enabled: !!student?.id },
		);
	const activeEnrollment = enrollmentHistory.find(
		(e) => e.year.status === "active",
	);

	if (isLoading) return <DetailSkeleton />;

	if (!student) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<User className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* ─── Header ─── */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{student.firstName} {student.lastName}
					</h1>
					<p className="text-muted-foreground text-sm">
						{student.registrationNumber}
					</p>
					{activeEnrollment && (
						<div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
							<BookOpen className="h-3.5 w-3.5" />
							{activeEnrollment.class.name} · {activeEnrollment.year.name}
						</div>
					)}
				</div>
				<Button
					size="sm"
					onClick={() => EnrollStudentDialog.call({ studentId: student.id })}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("enrollments.enroll_btn", "Enroll")}
				</Button>
			</div>

			<div className="flex border-border border-b" role="tablist">
				{TAB_NAV.map(({ to, label, fallback }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						{t(label, fallback)}
					</NavLink>
				))}
			</div>

			<Outlet context={student} />
		</div>
	);
}
