import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

/** Classes listed by name before "and N more". */
const SHOWN_CLASSES = 5;

/**
 * What is still open in the year being left before `year` becomes the active
 * one: classes without a closed annual jury, students with no class in the
 * new year. A warning: activation stays possible.
 */
export function ActivationChecklist({
	year,
}: {
	year: { id: string; name: string };
}) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery(
		trpc.academicYears.activationChecklist.queryOptions({ id: year.id }),
	);

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	const intro = (
		<p>{t("admin.academicYears.activate.intro", { year: year.name })}</p>
	);
	if (!data?.fromYear) return intro;

	const from = data.fromYear.name;
	const missingJury = data.classesWithoutJury;
	const shown = missingJury.slice(0, SHOWN_CLASSES);
	const juriesDone = missingJury.length === 0;
	const studentsDone = data.unplacedStudentCount === 0;

	return (
		<div className="space-y-3">
			{intro}
			<ul className="space-y-2">
				<CheckItem
					done={juriesDone}
					text={
						juriesDone
							? t("admin.academicYears.activate.juriesDone", {
									count: data.classCount,
									year: from,
								})
							: t("admin.academicYears.activate.juriesMissing", {
									count: missingJury.length,
									total: data.classCount,
									year: from,
								})
					}
					detail={
						juriesDone
							? null
							: [
									shown.map((c) => c.name).join(", "),
									missingJury.length > shown.length
										? t("admin.academicYears.activate.andMore", {
												count: missingJury.length - shown.length,
											})
										: null,
								]
									.filter(Boolean)
									.join(" ")
					}
				/>
				<CheckItem
					done={studentsDone}
					text={
						studentsDone
							? t("admin.academicYears.activate.studentsDone", {
									from,
									year: year.name,
								})
							: t("admin.academicYears.activate.studentsMissing", {
									count: data.unplacedStudentCount,
									from,
									year: year.name,
								})
					}
					detail={
						studentsDone ? null : t("admin.academicYears.activate.studentsHint")
					}
				/>
			</ul>
			{!(juriesDone && studentsDone) && (
				<p className="text-xs">{t("admin.academicYears.activate.warning")}</p>
			)}
		</div>
	);
}

function CheckItem({
	done,
	text,
	detail,
}: {
	done: boolean;
	text: string;
	detail: string | null;
}) {
	const Icon = done ? CheckCircle2 : AlertTriangle;
	return (
		<li className="flex items-start gap-2 rounded-md border p-2.5">
			<Icon
				className={
					done
						? "mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
						: "mt-0.5 h-4 w-4 shrink-0 text-amber-600"
				}
			/>
			<div className="min-w-0">
				<p className="text-foreground">{text}</p>
				{detail && <p className="mt-0.5 text-xs">{detail}</p>}
			</div>
		</li>
	);
}
