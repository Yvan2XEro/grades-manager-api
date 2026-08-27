import { ArrowLeft, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

const TAB_NAV = [
	{ to: "profile", label: "students.tab_profile" },
	{ to: "grades", label: "students.tab_grades" },
	{ to: "fees", label: "students.tab_fees" },
	{ to: "attendance", label: "students.tab_attendance" },
] as const;

export function StudentDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data: student, isLoading } = trpc.students.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
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
			{/* Back */}
			<Link
				to="/students"
				className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("nav.students")}
			</Link>

			{/* Title */}
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{student.firstName} {student.lastName}
				</h1>
				<p className="text-muted-foreground text-sm">
					{student.registrationNumber}
				</p>
			</div>

			{/* Tab nav */}
			<div className="flex border-border border-b" role="tablist">
				{TAB_NAV.map(({ to, label }) => (
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
						{t(label, to)}
					</NavLink>
				))}
			</div>

			{/* Active tab content */}
			<Outlet context={student} />
		</div>
	);
}
