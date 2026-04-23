import {
	Check,
	Languages,
	LogOut,
	Menu,
	Moon,
	Music2,
	PanelLeftClose,
	Search,
	Settings,
	Sun,
	Volume,
	Volume1,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
	getTheme,
	getVolume,
	isSoundEnabled,
	type SoundTheme,
	setSoundEnabled,
	setTheme,
	setVolume,
	sounds,
} from "@/lib/sounds";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { authClient } from "../../lib/auth-client";
import { useStore } from "../../store";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "./NotificationBell";

const isMac =
	typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

const THEMES: { id: SoundTheme; label: string; emoji: string }[] = [
	{ id: "default", label: "Défaut", emoji: "🎵" },
	{ id: "soft", label: "Doux", emoji: "🌙" },
	{ id: "playful", label: "Vif", emoji: "🎮" },
	{ id: "minimal", label: "Minimal", emoji: "·" },
];

function VolumeIcon({ vol, enabled }: { vol: number; enabled: boolean }) {
	if (!enabled || vol === 0) return <VolumeX className="h-4 w-4" />;
	if (vol < 0.35) return <Volume className="h-4 w-4" />;
	if (vol < 0.7) return <Volume1 className="h-4 w-4" />;
	return <Volume2 className="h-4 w-4" />;
}

const Header: React.FC = () => {
	const { user, sidebarOpen, toggleSidebar, clearUser } = useStore();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();
	const [cmdOpen, setCmdOpen] = useState(false);
	const [soundOn, setSoundOn] = useState(isSoundEnabled);
	const [volume, setVolumeState] = useState(getVolume);
	const [theme, setThemeState] = useState<SoundTheme>(getTheme);
	const { resolvedTheme, setTheme: setAppTheme } = useTheme();

	const toggleDarkMode = () => {
		setAppTheme(resolvedTheme === "dark" ? "light" : "dark");
	};

	const handleToggleSidebar = () => {
		toggleSidebar();
		sounds.swoosh();
	};

	const handleOpenCmd = () => {
		setCmdOpen(true);
		sounds.sparkle();
	};

	const handleToggleSound = () => {
		const next = !soundOn;
		setSoundEnabled(next);
		setSoundOn(next);
	};

	const handleVolume = (val: number[]) => {
		const v = val[0] / 100;
		setVolume(v);
		setVolumeState(v);
		if (!soundOn) {
			setSoundEnabled(true);
			setSoundOn(true);
		}
	};

	const handleTheme = (t: SoundTheme) => {
		setTheme(t);
		setThemeState(t);
		// play a preview note
		sounds.notification();
	};

	const handleLogout = async () => {
		try {
			await authClient.signOut();
			clearUser();
			navigate("/auth/login");
			toast.success(t("auth.logout.success"));
		} catch (error) {
			console.error("Error logging out:", error);
			toast.error(t("auth.logout.error"));
		}
	};

	const crumbs = useBreadcrumbs();

	const userInitials =
		`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim() || "?";

	// ⌘K / Ctrl+K global shortcut
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setCmdOpen((v) => !v);
				sounds.sparkle();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<>
			<header className="sticky top-0 z-30 border-border border-b bg-dot-pattern-subtle bg-sidebar/95 backdrop-blur-sm">
				<div className="flex h-14 items-center justify-between px-4 md:px-6">
					{/* ── Left ── */}
					<div className="flex items-center gap-3">
						<Button
							onClick={handleToggleSidebar}
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
							aria-label={t("navigation.header.toggleSidebarAria")}
						>
							{sidebarOpen ? (
								<PanelLeftClose className="h-4 w-4" />
							) : (
								<Menu className="h-4 w-4" />
							)}
						</Button>

						{crumbs.length > 1 ? (
							<Breadcrumb className="hidden md:flex">
								<BreadcrumbList>
									{crumbs.map((crumb, index) => (
										<React.Fragment key={crumb.label}>
											{index > 0 && <BreadcrumbSeparator />}
											<BreadcrumbItem>
												{crumb.href ? (
													<BreadcrumbLink asChild>
														<Link to={crumb.href}>{crumb.label}</Link>
													</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
										</React.Fragment>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						) : (
							<h1 className="hidden font-semibold text-foreground text-sm md:block">
								{t(`navigation.header.${user?.role ?? "admin"}Dashboard`, {
									defaultValue: "Dashboard",
								})}
							</h1>
						)}
					</div>

					{/* ── Right ── */}
					<div className="flex items-center gap-1.5">
						{/* Search trigger */}
						<button
							type="button"
							onClick={handleOpenCmd}
							className="group hidden h-8 w-52 items-center gap-2 rounded-lg border border-border bg-input px-3 text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:text-foreground hover:shadow-md hover:shadow-primary/8 md:flex"
						>
							<Search className="size-3.5 shrink-0 transition-colors duration-200 group-hover:text-primary" />
							<span className="flex-1 text-left text-xs">
								{t("navigation.header.search")}
							</span>
							<kbd className="flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-sm">
								{isMac ? "⌘K" : "Ctrl+K"}
							</kbd>
						</button>

						{/* Search icon-only on mobile */}
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
							onClick={handleOpenCmd}
						>
							<Search className="h-4 w-4" />
						</Button>

						{/* Dark mode toggle */}
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-foreground"
							onClick={toggleDarkMode}
							aria-label={
								resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"
							}
						>
							{resolvedTheme === "dark" ? (
								<Sun className="h-4 w-4" />
							) : (
								<Moon className="h-4 w-4" />
							)}
						</Button>

						{/* Sound control popover */}
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-muted-foreground hover:text-foreground"
									aria-label="Paramètres sonores"
								>
									<VolumeIcon vol={volume} enabled={soundOn} />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-64 p-4">
								<div className="space-y-4">
									{/* Volume */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-medium text-sm">Volume</span>
											<button
												type="button"
												onClick={handleToggleSound}
												className="text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline"
											>
												{soundOn ? "Désactiver" : "Activer"}
											</button>
										</div>
										<div className="flex items-center gap-3">
											<VolumeX className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<Slider
												min={0}
												max={100}
												step={5}
												value={[Math.round(volume * 100)]}
												onValueChange={handleVolume}
												className="flex-1"
											/>
											<Volume2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										</div>
										<p className="text-center text-muted-foreground text-xs">
											{Math.round(volume * 100)}%
										</p>
									</div>

									{/* Themes */}
									<div className="space-y-2">
										<div className="flex items-center gap-1.5">
											<Music2 className="h-3.5 w-3.5 text-muted-foreground" />
											<span className="font-medium text-sm">Thème sonore</span>
										</div>
										<div className="grid grid-cols-2 gap-1.5">
											{THEMES.map((th) => (
												<button
													key={th.id}
													type="button"
													onClick={() => handleTheme(th.id)}
													className={cn(
														"flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors",
														theme === th.id
															? "border-primary bg-primary/8 font-medium text-primary"
															: "border-border hover:border-primary/40 hover:bg-muted/60",
													)}
												>
													<span className="text-sm">{th.emoji}</span>
													{th.label}
												</button>
											))}
										</div>
									</div>
								</div>
							</PopoverContent>
						</Popover>

						<NotificationBell />

						{/* Avatar / profile dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="h-8 w-8 rounded-full p-0"
									aria-label={t("navigation.header.profileMenuAria")}
								>
									<Avatar className="h-8 w-8">
										<AvatarImage
											src={user?.image ?? undefined}
											alt={t("navigation.header.profileMenuAria")}
										/>
										<AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
											{userInitials}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align="end" className="w-60">
								{/* User info */}
								<DropdownMenuLabel className="font-normal">
									<div className="flex items-center gap-3 py-1">
										<Avatar className="h-9 w-9">
											<AvatarImage src={user?.image ?? undefined} alt="" />
											<AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
												{userInitials}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="truncate font-medium text-sm">
												{user?.firstName} {user?.lastName}
											</p>
											<p className="truncate text-muted-foreground text-xs">
												{user?.email}
											</p>
										</div>
									</div>
								</DropdownMenuLabel>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									className="gap-2"
									onSelect={(e) => {
										e.preventDefault();
										navigate("/settings");
									}}
								>
									<Settings className="h-4 w-4" />
									{t("settings.menuLabel")}
								</DropdownMenuItem>

								{/* Language sub-menu */}
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="gap-2">
										<Languages className="h-4 w-4" />
										{t("navigation.header.language", {
											defaultValue: "Langue",
										})}
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										{(["fr", "en"] as const).map((lang) => (
											<DropdownMenuItem
												key={lang}
												className={cn(
													"gap-2",
													i18n.language === lang && "font-medium",
												)}
												onSelect={() => {
													i18n.changeLanguage(lang);
													localStorage.setItem("lng", lang);
												}}
											>
												<Check
													className={cn(
														"h-3.5 w-3.5",
														i18n.language === lang
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												{lang === "fr" ? "Français" : "English"}
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									className="gap-2 text-destructive focus:text-destructive"
									onSelect={(e) => {
										e.preventDefault();
										handleLogout();
									}}
								>
									<LogOut className="h-4 w-4" />
									{t("auth.logout.aria")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
		</>
	);
};

export default Header;
