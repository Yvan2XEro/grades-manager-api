import { Bell, LogOut, Menu, PanelLeftClose } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
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
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const Header: React.FC = () => {
	const { user, sidebarOpen, toggleSidebar, clearUser } = useStore();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();

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

	return (
		<header className="sticky top-0 z-30 border-border border-b bg-card/80 backdrop-blur-xl">
			<div className="flex h-16 items-center justify-between px-4 md:px-6">
				<div className="flex items-center gap-3">
					<Button
						onClick={toggleSidebar}
						variant="ghost"
						size="icon"
						className="h-9 w-9 text-muted-foreground hover:text-foreground"
						aria-label={t("navigation.header.toggleSidebarAria")}
					>
						{sidebarOpen ? (
							<PanelLeftClose className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</Button>
					{crumbs.length > 1 && (
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
					)}
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full bg-muted p-0.5">
						{(["en", "fr"] as const).map((lang) => (
							<button
								key={lang}
								type="button"
								onClick={() => {
									i18n.changeLanguage(lang);
									localStorage.setItem("lng", lang);
								}}
								className={cn(
									"rounded-full px-3 py-1 font-semibold text-xs uppercase transition-all duration-200",
									i18n.language === lang
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{lang}
							</button>
						))}
					</div>

					<Button
						variant="ghost"
						size="icon"
						className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
						aria-label={t("navigation.header.notificationsAria")}
					>
						<Bell className="h-[18px] w-[18px]" />
						<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="h-9 gap-2 rounded-full px-2"
								aria-label={t("navigation.header.profileMenuAria")}
							>
								<Avatar className="h-8 w-8">
									<AvatarImage
										src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp"
										alt={t("navigation.header.profileMenuAria")}
									/>
									<AvatarFallback className="bg-primary/10 font-semibold text-primary text-xs">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<span className="hidden font-medium text-foreground text-sm md:inline">
									{user?.firstName}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col gap-1">
									<p className="font-medium text-sm">
										{user?.firstName} {user?.lastName}
									</p>
									<p className="text-muted-foreground text-xs">{user?.email}</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="gap-2 text-destructive focus:text-destructive"
								onSelect={(event) => {
									event.preventDefault();
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
	);
};

export default Header;
