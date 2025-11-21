import { sendPending } from "@/modules/notifications/notifications.service";
import { closeExpiredApprovedExams } from "@/modules/workflows/workflows.service";

type IntervalHandle = ReturnType<typeof setInterval>;

export function startBackgroundJobs() {
	const timers: IntervalHandle[] = [];

	timers.push(
		setInterval(
			async () => {
				await closeExpiredApprovedExams();
			},
			5 * 60 * 1000,
		),
	);

	timers.push(
		setInterval(async () => {
			await sendPending();
		}, 60 * 1000),
	);

	return () => timers.forEach((timer) => clearInterval(timer));
}
