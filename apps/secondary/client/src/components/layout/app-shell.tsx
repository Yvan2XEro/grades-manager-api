import { ChevronRight, Globe, LogOut, Settings } from "lucide-react";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
	BreadcrumbsContext,
	BreadcrumbsProvider,
} from "@/contexts/breadcrumbs-context";
import { authClient, signOut, useSession } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { AdminSidebar } from "./admin-sidebar";
import { PrincipalSidebar } from "./principal-sidebar";
import { TeacherSidebar } from "./teacher-sidebar";

function Breadcrumbs() {
	const { crumbs } = useContext(BreadcrumbsContext);
	if (crumbs.length === 0) return null;
	return (
		<nav className="flex min-w-0 items-center gap-1 overflow-hidden text-sm">
			{crumbs.map((crumb, i) => {
				const isLast = i === crumbs.length - 1;
				return (
					<span
						key={`${crumb.label}-${i}`}
						className="flex min-w-0 items-center gap-1"
					>
						{i > 0 && (
							<ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
						)}
						{isLast || !crumb.href ? (
							<span
								className={
									isLast
										? "truncate font-medium text-foreground"
										: "truncate text-muted-foreground"
								}
							>
								{crumb.label}
							</span>
						) : (
							<Link
								to={crumb.href}
								className="truncate text-muted-foreground transition-colors hover:text-foreground"
							>
								{crumb.label}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}

function getInitials(name?: string | null): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
	children: React.ReactNode;
}

export function AppShell({ children }: Props) {
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session } = useSession();
	const { data: org } = authClient.useActiveOrganization();
	const { data: years, isSuccess: yearsLoaded } =
		trpc.academicYears.list.useQuery();
	const activeYear = (years ?? []).find((y) => y.status === "active");
	const isSysAdmin =
		(session?.user as { role?: string } | undefined)?.role === "admin";

	// Redirect to onboarding when no academic year exists (first connection)
	// System admins have no institution context — skip this redirect
	useEffect(() => {
		if (
			!isSysAdmin &&
			yearsLoaded &&
			(years ?? []).length === 0 &&
			!location.pathname.includes("onboarding")
		) {
			navigate("/onboarding", { replace: true });
		}
	}, [isSysAdmin, yearsLoaded, years, location.pathname]);
	const myMember = org?.members?.find((m) => m.userId === session?.user?.id);
	const role = myMember?.role ?? "teacher";

	const RoleSidebar =
		role === "admin"
			? AdminSidebar
			: role === "principal"
				? PrincipalSidebar
				: TeacherSidebar;

	const { i18n } = useTranslation();
	const toggleLang = () => {
		const next = i18n.language === "fr" ? "en" : "fr";
		i18n.changeLanguage(next);
		localStorage.setItem("i18n_lang", next);
	};

	const handleSignOut = () =>
		signOut({ fetchOptions: { onSuccess: () => navigate("/login") } });

	return (
		<BreadcrumbsProvider>
			<SidebarProvider className="h-svh overflow-hidden">
				<RoleSidebar />
				<main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
					<div className="flex flex-shrink-0 items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
						<SidebarTrigger />
						<div className="mx-1 h-5 w-px flex-shrink-0 bg-border" />
						<div className="min-w-0 flex-1">
							<Breadcrumbs />
						</div>
						{activeYear && (
							<span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs sm:inline-flex">
								{activeYear.name}
							</span>
						)}
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs transition-opacity hover:opacity-90"
								>
									{getInitials(session?.user?.name)}
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-56 p-2" align="end">
								<div className="px-2 py-1.5">
									<p className="truncate font-medium text-sm">
										{session?.user?.name}
									</p>
									<p className="truncate text-muted-foreground text-xs">
										{session?.user?.email}
									</p>
								</div>
								<div className="my-1 h-px bg-border" />
								<Link
									to="/settings"
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground text-sm transition-colors hover:bg-muted"
								>
									<Settings className="h-4 w-4" />
									Settings & profile
								</Link>
								<button
									type="button"
									onClick={toggleLang}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground text-sm transition-colors hover:bg-muted"
								>
									<Globe className="h-4 w-4" />
									{i18n.language === "fr"
										? "Switch to English"
										: "Passer en français"}
								</button>
								<button
									type="button"
									onClick={handleSignOut}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-destructive text-sm transition-colors hover:bg-destructive/10"
								>
									<LogOut className="h-4 w-4" />
									Sign out
								</button>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1 overflow-y-auto p-6">{children}</div>
				</main>
			</SidebarProvider>
		</BreadcrumbsProvider>
	);
}
