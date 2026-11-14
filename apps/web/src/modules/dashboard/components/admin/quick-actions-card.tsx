import {
	ArrowUpRight,
	BarChart3,
	CalendarDays,
	ClipboardCheck,
	ClipboardList,
	TrendingUp,
	UserPlus,
} from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ExternalLinkIcon } from "@/components/navigation/external-link-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatePersonDialog } from "@/modules/people/components/create-person-dialog";
import { useDashboardPages } from "../../hooks/use-dashboard-pages";

const ROW =
	"group flex w-full items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-left font-medium text-foreground text-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground";

function RowContent({
	icon,
	label,
	trailing,
}: {
	icon: React.ReactNode;
	label: string;
	trailing?: React.ReactNode;
}) {
	return (
		<>
			<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/60 shadow-sm transition-transform duration-150 group-hover:scale-110">
				{icon}
			</span>
			<span className="flex-1">{label}</span>
			{trailing ?? (
				<ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
			)}
		</>
	);
}

/** Shortcuts: they open a dialog over the dashboard; statistics is a page of its own. */
export function QuickActionsCard() {
	const { t } = useTranslation();
	const openPage = useDashboardPages();
	const k = (key: string) => t(`admin.dashboard.quickActions.${key}`);
	const actions = [
		{
			key: "addStudent",
			icon: <UserPlus className="h-4 w-4" />,
			onClick: () => CreatePersonDialog.call(),
		},
		{
			key: "exams",
			icon: <ClipboardCheck className="h-4 w-4" />,
			onClick: () => openPage("exams"),
		},
		{
			key: "enrollments",
			icon: <ClipboardList className="h-4 w-4" />,
			onClick: () => openPage("enrollments"),
		},
		{
			key: "academicYears",
			icon: <CalendarDays className="h-4 w-4" />,
			onClick: () => openPage("academicYears"),
		},
	];

	return (
		<Card className="border-0 shadow-sm lg:col-span-2">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</div>
					<CardTitle className="text-base">{k("title")}</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{actions.map((action) => (
					<button
						key={action.key}
						type="button"
						onClick={action.onClick}
						className={ROW}
					>
						<RowContent icon={action.icon} label={k(action.key)} />
					</button>
				))}
				<Link to="/statistics" className={ROW}>
					<RowContent
						icon={<BarChart3 className="h-4 w-4" />}
						label={k("statistics")}
						trailing={<ExternalLinkIcon className="h-4 w-4" />}
					/>
				</Link>
			</CardContent>
		</Card>
	);
}
