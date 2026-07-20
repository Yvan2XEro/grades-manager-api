import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const tabs = [
	{ path: "structures", labelKey: "feeClearance.structures.title" },
	{ path: "assignments", labelKey: "feeClearance.assignments.title" },
	{ path: "gating", labelKey: "feeClearance.gating.title" },
] as const;

export default function FeeClearanceHub() {
	const { t } = useTranslation();
	const location = useLocation();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl">{t("feeClearance.title")}</h1>
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.subtitle")}
				</p>
			</div>

			<nav className="border-b">
				<div className="flex gap-1">
					{tabs.map((tab) => {
						const href = `/admin/fee-clearance/${tab.path}`;
						const isActive = location.pathname.startsWith(href);
						return (
							<NavLink
								key={tab.path}
								to={href}
								className={cn(
									"border-b-2 px-4 py-2 font-medium text-sm transition-colors",
									isActive
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								{t(tab.labelKey)}
							</NavLink>
						);
					})}
				</div>
			</nav>

			<Outlet />
		</div>
	);
}
