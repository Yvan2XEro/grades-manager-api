import { Bell, LogOut, Menu, X } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { authClient } from "../../lib/auth-client";
import { useStore } from "../../store";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

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

	const userInitials =
		`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim() || "?";

	return (
		<header className="sticky top-0 z-30 border-border border-b bg-background/80 backdrop-blur">
			<div className="flex items-center justify-between px-4 py-3 md:px-6">
				<div className="flex items-center gap-2">
					<Button
						onClick={toggleSidebar}
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						aria-label={t("navigation.header.toggleSidebarAria")}
					>
						{sidebarOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</Button>
					<div className="hidden md:block">
						<h1 className="font-semibold text-lg">
							{user?.role === "admin"
								? t("navigation.header.adminDashboard")
								: t("navigation.header.teacherDashboard")}
						</h1>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Select
						value={i18n.language}
						onValueChange={(value) => {
							i18n.changeLanguage(value);
							localStorage.setItem("lng", value);
						}}
					>
						<SelectTrigger
							aria-label={t("navigation.header.languageSelectAria")}
						>
							<SelectValue
								placeholder={t("navigation.header.languageSelectPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="en">En</SelectItem>
							<SelectItem value="fr">Fr</SelectItem>
						</SelectContent>
					</Select>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-10 rounded-full p-0"
								aria-label={t("navigation.header.profileMenuAria")}
							>
								<Avatar className="size-10">
									<AvatarImage
										src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp"
										alt={t("navigation.header.profileMenuAria")}
									/>
									<AvatarFallback>{userInitials}</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>
								{user?.firstName} {user?.lastName}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="gap-2"
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

					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						aria-label={t("navigation.header.notificationsAria")}
					>
						<Bell className="h-5 w-5" />
					</Button>
					<Button
						onClick={handleLogout}
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						aria-label={t("auth.logout.aria")}
					>
						<LogOut className="h-5 w-5" />
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
