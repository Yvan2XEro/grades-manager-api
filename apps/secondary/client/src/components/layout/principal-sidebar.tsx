import {
	FileText,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router";
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
import { authClient, signOut, useSession } from "@/lib/auth-client";

function getInitials(name?: string | null): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const items: { to: string; label: string; Icon: LucideIcon; end?: boolean }[] =
	[
		{ to: "/", label: "nav.dashboard", Icon: LayoutDashboard, end: true },
		{ to: "/report-cards", label: "nav.report_cards", Icon: FileText },
	];

export function PrincipalSidebar() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();

	const isItemActive = (to: string, end?: boolean) => {
		if (end) return location.pathname === to;
		return location.pathname === to || location.pathname.startsWith(`${to}/`);
	};

	const handleSignOut = () =>
		signOut({ fetchOptions: { onSuccess: () => navigate("/login") } });

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="px-2 py-1">
					<p className="font-bold text-sidebar-foreground text-sm">
						{org?.name ?? "TKAMS Secondary"}
					</p>
					<p className="text-sidebar-foreground/60 text-xs">Principal</p>
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
					<div className="flex items-center gap-2.5">
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
						<button
							type="button"
							onClick={handleSignOut}
							title={t("auth.logout", "Sign out")}
							className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
