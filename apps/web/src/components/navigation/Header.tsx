import { Bell, LogOut, Menu, PanelLeftClose } from "lucide-react";
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
		<header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
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
				</div>

				<div className="flex items-center gap-2">
					<Select
						value={i18n.language}
						onValueChange={(value) => {
							i18n.changeLanguage(value);
							localStorage.setItem("lng", value);
						}}
					>
						<SelectTrigger
							aria-label={t("navigation.header.languageSelectAria")}
							className="h-9 w-[70px] border-none bg-transparent text-sm shadow-none"
						>
							<SelectValue
								placeholder={t("navigation.header.languageSelectPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="en">EN</SelectItem>
							<SelectItem value="fr">FR</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="ghost"
						size="icon"
						className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
						aria-label={t("navigation.header.notificationsAria")}
					>
						<Bell className="h-[18px] w-[18px]" />
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
									<p className="text-muted-foreground text-xs">
										{user?.email}
									</p>
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
