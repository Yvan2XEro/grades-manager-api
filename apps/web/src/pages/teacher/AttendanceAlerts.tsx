import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BellRing } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient } from "../../utils/trpc";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const AttendanceAlerts = () => {
	const { t } = useTranslation();
	const [message, setMessage] = useState("");

	const notificationsQuery = useQuery(
		trpc.notifications.list.queryOptions({ status: "pending" }),
	);

	const sendAlert = useMutation({
		mutationFn: () =>
			trpcClient.workflows.attendanceAlert.mutate({
				classCourseId: "",
				severity: "warning",
				message,
			}),
		onSuccess: () => {
			toast.success(
				t("teacher.attendance.toast.sent", { defaultValue: "Alert queued" }),
			);
			setMessage("");
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const alerts =
		notificationsQuery.data?.filter(
			(notification) => notification.type === "attendance_alert",
		) ?? [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					{t("teacher.attendance.title")}
				</h1>
				<p className="text-muted-foreground">
					{t("teacher.attendance.subtitle")}
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t("teacher.attendance.openAlerts")}</CardTitle>
						<CardDescription>
							{t("teacher.attendance.subtitle")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{alerts.length ? (
							alerts.map((alert) => (
								<div
									key={alert.id}
									className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4"
								>
									<div className="rounded-full bg-amber-100 p-2 text-amber-700">
										<AlertTriangle className="h-5 w-5" />
									</div>
									<div>
										<p className="font-medium text-foreground">{alert.type}</p>
										<p className="text-sm text-muted-foreground">
											{JSON.stringify(alert.payload)}
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-sm text-muted-foreground">
								{t("teacher.attendance.none", {
									defaultValue: "No alerts yet.",
								})}
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t("teacher.attendance.broadcast")}</CardTitle>
						<CardDescription>
							{t("teacher.attendance.broadcastDesc")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Textarea
							placeholder={t("teacher.attendance.placeholder", {
								defaultValue: "Message",
							})}
							value={message}
							onChange={(event) => setMessage(event.target.value)}
						/>
						<Button
							type="button"
							className="flex items-center"
							disabled={!message}
							onClick={() => sendAlert.mutate()}
						>
							<BellRing className="mr-2 h-4 w-4" />
							{t("teacher.attendance.send", { defaultValue: "Send alert" })}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AttendanceAlerts;
