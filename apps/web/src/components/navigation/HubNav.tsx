import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";

interface HubNavTab {
	readonly path: string;
	readonly labelKey: string;
}

interface HubNavProps {
	tabs: readonly HubNavTab[];
	basePath: string;
}

export function HubNav({ tabs, basePath }: HubNavProps) {
	const { t } = useTranslation();

	return (
		<>
			<nav className="border-b">
				<div className="flex gap-1">
					{tabs.map((tab) => (
						<NavLink
							key={tab.path}
							to={`${basePath}/${tab.path}`}
							className={({ isActive }) =>
								cn(
									"border-b-2 px-4 py-2 font-medium text-sm transition-colors",
									isActive
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)
							}
						>
							{t(tab.labelKey)}
						</NavLink>
					))}
				</div>
			</nav>
			<Outlet />
		</>
	);
}
