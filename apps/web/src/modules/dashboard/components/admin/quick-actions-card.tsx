import {
	ArrowUpRight,
	BarChart3,
	CalendarDays,
	ClipboardCheck,
	ClipboardList,
	TrendingUp,
	UserPlus,
} from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
	{
		label: "Ajouter un étudiant",
		icon: <UserPlus className="h-4 w-4" />,
		href: "/users/people",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Planifier un examen",
		icon: <ClipboardCheck className="h-4 w-4" />,
		href: "/exams",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Gérer les inscriptions",
		icon: <ClipboardList className="h-4 w-4" />,
		href: "/classes/enrollments",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Années académiques",
		icon: <CalendarDays className="h-4 w-4" />,
		href: "/academic-years",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Statistiques détaillées",
		icon: <BarChart3 className="h-4 w-4" />,
		href: "/statistics",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
];

export function QuickActionsCard() {
	return (
		<Card className="border-0 shadow-sm lg:col-span-2">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</div>
					<CardTitle className="text-base">Raccourcis</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{QUICK_ACTIONS.map((action) => (
					<Link
						key={action.href}
						to={action.href}
						className={cn(
							"group flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all duration-150",
							action.color,
						)}
					>
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/60 shadow-sm transition-transform duration-150 group-hover:scale-110">
							{action.icon}
						</span>
						<span className="flex-1">{action.label}</span>
						<ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
					</Link>
				))}
			</CardContent>
		</Card>
	);
}
