import {
	Building2,
	ChevronRight,
	Globe,
	LayoutDashboard,
	LogOut,
	Settings,
	Users,
} from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	BreadcrumbsContext,
	BreadcrumbsProvider,
} from "@/contexts/breadcrumbs-context";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SysAdminBreadcrumbs() {
	const { crumbs } = useContext(BreadcrumbsContext);
	const { t } = useTranslation();

	const rootCrumb = {
		label: t("sysadmin.nav.dashboard", "Dashboard"),
		href: "/sysadmin",
	};
	const allCrumbs = [rootCrumb, ...crumbs];

	return (
		<nav className="flex min-w-0 items-center gap-1 overflow-hidden text-sm">
			{allCrumbs.map((crumb, i) => {
				const isLast = i === allCrumbs.length - 1;
				return (
					<span
						key={`${crumb.label}-${i}`}
						className="flex min-w-0 items-center gap-1"
					>
						{i > 0 && (
							<ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
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

interface Props {
	children: React.ReactNode;
}

export function SysAdminShell({ children }: Props) {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { t, i18n } = useTranslation();

	const NAV_ITEMS = [
		{
			to: "/sysadmin",
			icon: <LayoutDashboard className="h-4 w-4" />,
			label: t("sysadmin.nav.overview", "Overview"),
		},
		{
			to: "/sysadmin/institutions",
			icon: <Building2 className="h-4 w-4" />,
			label: t("sysadmin.nav.institutions", "Institutions"),
		},
		{
			to: "/sysadmin/users",
			icon: <Users className="h-4 w-4" />,
			label: t("sysadmin.nav.users", "Users"),
		},
	];

	const handleSignOut = () =>
		signOut({ fetchOptions: { onSuccess: () => navigate("/login") } });

	const toggleLang = () => {
		const next = i18n.language === "fr" ? "en" : "fr";
		i18n.changeLanguage(next);
		localStorage.setItem("i18n_lang", next);
	};

	return (
		<BreadcrumbsProvider>
			<div className="flex h-svh overflow-hidden bg-background">
				{/* Sidebar */}
				<aside className="flex w-56 flex-shrink-0 flex-col bg-zinc-950 text-zinc-100">
					{/* Brand */}
					<div className="flex items-center gap-2.5 border-zinc-800 border-b px-4 py-4">
						<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-primary/10">
							<img
								src="/logo.png"
								alt="TKAMS"
								className="h-5 w-5 object-contain"
							/>
						</div>
						<div>
							<p className="font-semibold text-sm text-zinc-100 leading-none">
								TKAMS
							</p>
							<p className="mt-0.5 text-[10px] text-zinc-500 leading-none">
								{t("sysadmin.shell.subtitle", "System Admin")}
							</p>
						</div>
					</div>

					{/* Nav */}
					<nav className="flex-1 space-y-0.5 p-2 pt-3">
						{NAV_ITEMS.map((item) => {
							const isActive =
								item.to === "/sysadmin"
									? location.pathname === "/sysadmin"
									: location.pathname.startsWith(item.to);
							return (
								<Link
									key={item.to}
									to={item.to}
									className={cn(
										"flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
										isActive
											? "bg-zinc-800 text-zinc-100"
											: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
									)}
								>
									<span
										className={cn(
											"flex-shrink-0",
											isActive ? "text-primary" : "text-zinc-500",
										)}
									>
										{item.icon}
									</span>
									{item.label}
									{isActive && (
										<ChevronRight className="ml-auto h-3 w-3 text-zinc-600" />
									)}
								</Link>
							);
						})}
					</nav>

					{/* Footer: user menu */}
					<div className="border-zinc-800 border-t p-3">
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-zinc-900"
								>
									<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white text-xs">
										{getInitials(session?.user?.name)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-xs text-zinc-200">
											{session?.user?.name ?? "—"}
										</p>
										<p className="truncate text-[10px] text-zinc-500">
											{session?.user?.email}
										</p>
									</div>
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2" side="right" align="end">
								<Link
									to="/sysadmin/settings"
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground text-sm transition-colors hover:bg-muted"
								>
									<Settings className="h-4 w-4" />
									{t("sysadmin.shell.settings_profile", "Settings & profile")}
								</Link>
								<button
									type="button"
									onClick={toggleLang}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground text-sm transition-colors hover:bg-muted"
								>
									<Globe className="h-4 w-4" />
									{i18n.language === "fr"
										? "Switch to English"
										: "Passer en français"}
								</button>
								<div className="my-1 h-px bg-border" />
								<button
									type="button"
									onClick={handleSignOut}
									className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-destructive text-sm transition-colors hover:bg-destructive/10"
								>
									<LogOut className="h-4 w-4" />
									{t("sysadmin.shell.sign_out", "Sign out")}
								</button>
							</PopoverContent>
						</Popover>
					</div>
				</aside>

				{/* Main content */}
				<main className="flex min-h-0 flex-1 flex-col overflow-hidden">
					{/* Top bar */}
					<div className="flex flex-shrink-0 items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur">
						<div className="min-w-0 flex-1">
							<SysAdminBreadcrumbs />
						</div>
						<span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
							{t("sysadmin.shell.platform_admin", "Platform Admin")}
						</span>
					</div>
					<div className="flex-1 overflow-y-auto p-6">{children}</div>
				</main>
			</div>
		</BreadcrumbsProvider>
	);
}
