import type { TFunction } from "i18next";

/** "Today", "Tomorrow", `+3j` or `-2j` relative to the current day. */
export function daysUntil(date: Date | string, t: TFunction) {
	const d = new Date(date);
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	d.setHours(0, 0, 0, 0);
	const diff = Math.round(
		(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diff === 0) return t("student.exams.today");
	if (diff === 1) return t("student.exams.tomorrow");
	if (diff < 0) return `-${Math.abs(diff)}j`;
	return `+${diff}j`;
}

/** Text colour of the countdown: red under 3 days, amber under a week. */
export function urgencyColor(date: Date | string) {
	const d = new Date(date);
	const diff = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	if (diff < 0) return "text-muted-foreground";
	if (diff <= 3) return "text-destructive font-semibold";
	if (diff <= 7) return "text-amber-600 dark:text-amber-400 font-medium";
	return "text-emerald-600 dark:text-emerald-400";
}

/** Short month of a date, in French (calendar tiles). */
export const shortMonth = (date: Date | string) =>
	new Date(date).toLocaleDateString("fr-FR", { month: "short" });
