import { BookOpen, BookUser, School, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

function HeaderSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-24" />
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-5 w-14" />
					<Skeleton className="h-5 w-20" />
				</div>
			</div>
			<div className="flex gap-4 border-border border-b pb-px">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-8 w-24" />
				))}
			</div>
		</div>
	);
}

export function ClassDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const TABS = [
		{
			to: `/classes/${id}/roster`,
			label: "classes.tab_roster",
			fallback: "Roster",
			icon: Users,
		},
		{
			to: `/classes/${id}/grades`,
			label: "classes.tab_grades",
			fallback: "Grades",
			icon: BookOpen,
		},
		{
			to: `/classes/${id}/assignments`,
			label: "classes.tab_assignments",
			fallback: "Teachers",
			icon: BookUser,
		},
	];

	const { data: klass, isLoading } = trpc.classes.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	if (isLoading) return <HeaderSkeleton />;

	if (!klass) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<School className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold text-2xl text-foreground">{klass.name}</h1>
				<div className="flex flex-wrap gap-2">
					{klass.code && <Badge variant="outline">{klass.code}</Badge>}
					{klass.level && <Badge variant="secondary">{klass.level}</Badge>}
				</div>
			</div>

			<div className="flex border-border border-b" role="tablist">
				{TABS.map(({ to, label, fallback, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						<Icon className="h-4 w-4" />
						{t(label, fallback)}
					</NavLink>
				))}
			</div>

			<Outlet />
		</div>
	);
}
