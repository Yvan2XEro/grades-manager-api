import {
	CalendarCheck,
	GraduationCap,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
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
import { signOut } from "@/lib/auth-client";

const items: { to: string; label: string; Icon: LucideIcon; end?: boolean }[] =
	[
		{ to: "/", label: "nav.dashboard", Icon: LayoutDashboard, end: true },
		{ to: "/grades", label: "nav.grades", Icon: GraduationCap },
		{ to: "/attendance", label: "nav.attendance", Icon: CalendarCheck },
	];

export function TeacherSidebar() {
	const { t } = useTranslation();
	const location = useLocation();

	const isItemActive = (to: string, end?: boolean) => {
		if (end) return location.pathname === to;
		return location.pathname === to || location.pathname.startsWith(`${to}/`);
	};

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="px-2 py-1">
					<p className="font-bold text-sidebar-foreground text-sm">TKAMS</p>
					<p className="text-sidebar-foreground/60 text-xs">Secondaire</p>
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
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={() => signOut()}>
							<LogOut />
							<span>{t("auth.logout")}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
