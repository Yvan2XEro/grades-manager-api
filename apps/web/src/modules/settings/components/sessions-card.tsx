import { formatDistanceToNow } from "date-fns";
import { Monitor, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useSessions } from "../hooks/use-sessions";
import { getBrowserLabel, resolveToken } from "../services/sessions";

/** Active login sessions, each revocable, plus "revoke all others". */
export function SessionsCard() {
	const { t } = useTranslation();
	const { sessions, revokeSession, revokeOthers } = useSessions();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Monitor className="h-4 w-4 text-primary" />
					{t("settings.sessions.title")}
				</CardTitle>
				<CardDescription>{t("settings.sessions.description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{sessions.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("settings.sessions.empty")}
					</p>
				) : (
					sessions.map((entry) => {
						const createdAt = entry.createdAt
							? new Date(entry.createdAt)
							: null;
						const relative = createdAt
							? formatDistanceToNow(createdAt, { addSuffix: true })
							: t("settings.sessions.unknownTime");
						const browser = getBrowserLabel(entry.userAgent);
						return (
							<div
								key={resolveToken(entry as Record<string, unknown>) ?? browser}
								className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{browser}</span>
										{entry.current && (
											<Badge variant="secondary">
												{t("settings.sessions.current")}
											</Badge>
										)}
									</div>
									<p className="text-muted-foreground text-xs">
										{entry.ipAddress ?? t("settings.sessions.unknownIp")}
										{" · "}
										{relative}
									</p>
								</div>
								{!entry.current && entry.token && (
									<Button
										variant="outline"
										onClick={() => revokeSession.mutate(entry.token ?? "")}
										disabled={revokeSession.isPending}
										className="w-full md:w-auto"
									>
										{t("settings.sessions.revoke")}
									</Button>
								)}
							</div>
						);
					})
				)}
			</CardContent>
			<CardFooter className="justify-between">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<ShieldCheck className="h-4 w-4" />
					{t("settings.sessions.securityNote")}
				</div>
				<Button
					variant="outline"
					onClick={() => revokeOthers.mutate()}
					disabled={revokeOthers.isPending}
				>
					{t("settings.sessions.revokeAll")}
				</Button>
			</CardFooter>
		</Card>
	);
}
