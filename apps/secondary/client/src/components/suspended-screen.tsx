import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SuspendedScreen() {
	const { t } = useTranslation();

	async function handleSignOut() {
		await signOut();
		window.location.href = "/";
	}

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-6 p-6">
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
					<AlertTriangle className="h-8 w-8 text-destructive" />
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="font-bold text-xl">{t("suspended.title")}</h1>
					<p className="max-w-sm text-muted-foreground text-sm">
						{t("suspended.description")}
					</p>
				</div>
			</div>
			<Button variant="outline" onClick={handleSignOut}>
				{t("auth.logout")}
			</Button>
		</div>
	);
}
