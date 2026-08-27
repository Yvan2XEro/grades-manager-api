import {
	BookOpen,
	BookUser,
	Calendar,
	CalendarCheck,
	ClipboardList,
	CreditCard,
	FileText,
	GraduationCap,
	Layers,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	School,
	Settings,
	UserCheck,
	UserCog,
	Users,
	Users2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth-client";

const sections: {
	label: string;
	items: { to: string; label: string; Icon: LucideIcon; end?: boolean }[];
}[] = [
	{
		label: "Academic",
		items: [
			{
				to: "/",
				label: "nav.dashboard",
				Icon: LayoutDashboard,
				end: true,
			},
			{ to: "/students", label: "nav.students", Icon: Users },
			{ to: "/enrollments", label: "nav.enrollments", Icon: UserCheck },
			{ to: "/classes", label: "nav.classes", Icon: School },
			{ to: "/terms", label: "nav.terms", Icon: Calendar },
			{ to: "/subjects", label: "nav.subjects", Icon: BookOpen },
			{
				to: "/subject-assignments",
				label: "nav.subject_assignments",
				Icon: BookUser,
			},
			{ to: "/tracks", label: "nav.tracks", Icon: Layers },
			{ to: "/staff", label: "nav.staff", Icon: UserCog },
		],
	},
	{
		label: "Assessments",
		items: [
			{ to: "/grades", label: "nav.grades", Icon: GraduationCap },
			{ to: "/report-cards", label: "nav.report_cards", Icon: FileText },
			{ to: "/class-councils", label: "nav.class_councils", Icon: Users2 },
			{
				to: "/official-exams",
				label: "nav.official_exams",
				Icon: ClipboardList,
			},
		],
	},
	{
		label: "School",
		items: [
			{ to: "/finance", label: "nav.finance", Icon: CreditCard },
			{ to: "/attendance", label: "nav.attendance", Icon: CalendarCheck },
			{ to: "/settings", label: "nav.settings", Icon: Settings },
		],
	},
];

export function AdminSidebar() {
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
				{sections.map((section) => (
					<SidebarGroup key={section.label}>
						<SidebarGroupLabel>{section.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{section.items.map((item) => (
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
				))}
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
