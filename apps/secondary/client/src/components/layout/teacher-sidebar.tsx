import {
	CalendarCheck,
	FileText,
	GraduationCap,
	LayoutDashboard,
	type LucideIcon,
	School,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient, useSession } from "@/lib/auth-client";
import { UserProfileMenu } from "./user-profile-menu";

function getInitials(name?: string | null): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const items: { to: string; label: string; Icon: LucideIcon; end?: boolean }[] =
	[
		{ to: "/", label: "nav.dashboard", Icon: LayoutDashboard, end: true },
		{ to: "/classes", label: "nav.classes", Icon: School },
		{ to: "/grades", label: "nav.grades", Icon: GraduationCap },
		{ to: "/attendance", label: "nav.attendance", Icon: CalendarCheck },
		{ to: "/report-cards", label: "nav.report_cards", Icon: FileText },
	];

export function TeacherSidebar() {
	const { t } = useTranslation();
	const location = useLocation();
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();

	const isItemActive = (to: string, end?: boolean) => {
		if (end) return location.pathname === to;
		return location.pathname === to || location.pathname.startsWith(`${to}/`);
	};

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="px-2 py-1">
					<p className="font-bold text-sidebar-foreground text-sm">
						{org?.name ?? "TKAMS Secondary"}
					</p>
					<p className="text-sidebar-foreground/60 text-xs">Teacher</p>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										asChild
										isActive={isItemActive(item.to, item.end)}
									>
										<NavLink to={item.to} end={item.end}>
											<item.Icon />
											<span>{t(item.label)}</span>
										</NavLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<div className="border-sidebar-border border-t px-2 py-3">
					<UserProfileMenu align="start" side="top">
						<button
							type="button"
							className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-accent"
						>
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
								{getInitials(session?.user?.name)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sidebar-foreground text-sm">
									{session?.user?.name ?? "—"}
								</p>
								<p className="truncate text-muted-foreground text-xs">
									{session?.user?.email}
								</p>
							</div>
						</button>
					</UserProfileMenu>
					<p className="mt-2 text-center text-[10px] text-muted-foreground/50">
						<a
							href="mailto:support@tkams.com"
							className="transition-colors hover:text-muted-foreground/70"
						>
							support@tkams.com
						</a>
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
