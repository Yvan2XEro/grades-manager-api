import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BellRing, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient } from "../../utils/trpc";

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
				<h1 className="font-semibold text-2xl text-gray-900">
					{t("teacher.attendance.title")}
				</h1>
				<p className="text-gray-600">{t("teacher.attendance.subtitle")}</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("teacher.attendance.openAlerts")}
					</h2>
					<div className="mt-4 space-y-3">
						{alerts.length ? (
							alerts.map((alert) => (
								<div
									key={alert.id}
									className="flex items-start space-x-3 rounded-lg bg-gray-50 p-4"
								>
									<div className="rounded-full bg-amber-100 p-2 text-amber-700">
										<AlertTriangle className="h-5 w-5" />
									</div>
									<div>
										<p className="font-medium text-gray-900">{alert.type}</p>
										<p className="text-gray-600 text-sm">
											{JSON.stringify(alert.payload)}
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-gray-500 text-sm">
								{t("teacher.attendance.none", {
									defaultValue: "No alerts yet.",
								})}
							</p>
						)}
					</div>
				</div>
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("teacher.attendance.broadcast")}
					</h2>
					<p className="text-gray-600 text-sm">
						{t("teacher.attendance.broadcastDesc")}
					</p>
					<div className="mt-4 space-y-3">
						<textarea
							className="w-full rounded-lg border px-3 py-2"
							placeholder={t("teacher.attendance.placeholder", {
								defaultValue: "Message",
							})}
							value={message}
							onChange={(event) => setMessage(event.target.value)}
						/>
						<button
							type="button"
							className="flex items-center rounded-lg bg-primary-600 px-3 py-2 font-medium text-sm text-white disabled:opacity-50"
							disabled={!message}
							onClick={() => sendAlert.mutate()}
						>
							<BellRing className="mr-2 h-4 w-4" />
							{t("teacher.attendance.send", { defaultValue: "Send alert" })}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AttendanceAlerts;
