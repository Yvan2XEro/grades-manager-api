import { Globe, LogOut, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { signOut, useSession } from "@/lib/auth-client";

interface UserProfileMenuProps {
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
}

export function UserProfileMenu({
	children,
	align = "end",
	side = "bottom",
}: UserProfileMenuProps) {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate();
	const { data: session } = useSession();

	const handleSignOut = () =>
		signOut({ fetchOptions: { onSuccess: () => navigate("/login") } });
	const toggleLang = () => {
		const next = i18n.language === "fr" ? "en" : "fr";
		i18n.changeLanguage(next);
		localStorage.setItem("i18n_lang", next);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="w-56 p-2" align={align} side={side}>
				<div className="px-2 py-1.5">
					<p className="truncate font-medium text-sm">{session?.user?.name}</p>
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
					{t("profile.settings", "Settings & profile")}
				</Link>
				<button
					type="button"
					onClick={toggleLang}
					className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground text-sm transition-colors hover:bg-muted"
				>
					<Globe className="h-4 w-4" />
					{i18n.language === "fr"
						? t("profile.switch_english", "Switch to English")
						: t("profile.switch_french", "Passer en français")}
				</button>
				<button
					type="button"
					onClick={handleSignOut}
					className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-destructive text-sm transition-colors hover:bg-destructive/10"
				>
					<LogOut className="h-4 w-4" />
					{t("auth.logout", "Sign out")}
				</button>
			</PopoverContent>
		</Popover>
	);
}
