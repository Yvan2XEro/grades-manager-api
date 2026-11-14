import { useTranslation } from "react-i18next";
import type { RouterOutputs } from "@/utils/trpc";

type EnrollmentWindow = RouterOutputs["workflows"]["enrollmentWindows"][number];

export function EnrollmentWindowsPanel({
	windows,
}: {
	windows: EnrollmentWindow[] | undefined;
}) {
	const { t } = useTranslation();
	return (
		<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
			<h2 className="mb-3 font-heading font-semibold text-foreground text-lg">
				{t("dean.workflows.windows", { defaultValue: "Enrollment windows" })}
			</h2>
			<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
				{windows?.map((window) => (
					<div
						key={window.id}
						className="rounded-lg border px-4 py-3 text-foreground text-sm"
					>
						<p className="font-semibold">{window.classId}</p>
						<p className="text-muted-foreground text-xs">
							{window.academicYearId}
						</p>
						<p className="mt-1 text-primary text-xs uppercase">
							{window.status}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
