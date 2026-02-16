import { markStaleJobs } from "@/modules/batch-jobs/batch-jobs.service";
import { sendPending } from "@/modules/notifications/notifications.service";
import { closeExpiredApprovedExams } from "@/modules/workflows/workflows.service";
import { startJobQueue, stopJobQueue } from "./job-queue";

type IntervalHandle = ReturnType<typeof setInterval>;

const CRON_CLOSE_EXPIRED = "close-expired-approved-exams";
const CRON_SEND_NOTIFICATIONS = "send-pending-notifications";
const CRON_STALE_JOBS = "mark-stale-batch-jobs";

/**
 * Register scheduled cron jobs with pg-boss, or fall back to setInterval.
 */
export async function startBackgroundJobs(): Promise<() => Promise<void>> {
	const boss = await startJobQueue();

	if (boss) {
		// Ensure queues exist (pg-boss v10+ requires explicit creation)
		await boss.createQueue(CRON_CLOSE_EXPIRED);
		await boss.createQueue(CRON_SEND_NOTIFICATIONS);
		await boss.createQueue(CRON_STALE_JOBS);

		// Register handlers
		await boss.work(CRON_CLOSE_EXPIRED, { batchSize: 1 }, async () => {
			await closeExpiredApprovedExams();
		});

		await boss.work(CRON_SEND_NOTIFICATIONS, { batchSize: 1 }, async () => {
			await sendPending();
		});

		await boss.work(CRON_STALE_JOBS, { batchSize: 1 }, async () => {
			const count = await markStaleJobs(10);
			if (count > 0) console.log(`[Jobs] Marked ${count} batch jobs as stale`);
		});

		// Schedule recurring jobs
		await boss.schedule(CRON_CLOSE_EXPIRED, "*/5 * * * *"); // every 5 minutes
		await boss.schedule(CRON_SEND_NOTIFICATIONS, "* * * * *"); // every minute
		await boss.schedule(CRON_STALE_JOBS, "*/5 * * * *"); // every 5 minutes

		console.log("[Jobs] Crons registered via pg-boss");

		return async () => {
			await stopJobQueue();
		};
	}

	// Fallback: use setInterval when pg-boss is unavailable (PGlite dev mode)
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

	timers.push(
		setInterval(
			async () => {
				await markStaleJobs(10);
			},
			5 * 60 * 1000,
		),
	);

	console.log("[Jobs] Crons registered via setInterval (fallback)");

	return async () => {
		for (const timer of timers) {
			clearInterval(timer);
		}
	};
}
