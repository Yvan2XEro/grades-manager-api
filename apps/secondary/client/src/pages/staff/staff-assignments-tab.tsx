import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { trpc } from "@/utils/trpc";

type StaffData = { id: string };

export function StaffAssignmentsTab() {
	const { t } = useTranslation();
	const staff = useOutletContext<StaffData>();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];

	const { data: assignments = [], isLoading } =
		trpc.subjectAssignments.list.useQuery(
			{ academicYearId: activeYear?.id ?? "", staffId: staff.id },
			{ enabled: !!activeYear?.id && !!staff.id },
		);

	if (isLoading) {
		return (
			<div className="py-8 text-center text-muted-foreground text-sm">
				{t("common.loading", "Loading…")}
			</div>
		);
	}

	if (assignments.length === 0) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				<p className="font-medium">
					{t("staff.no_assignments", "No subject assignments found.")}
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border">
			<table className="w-full text-sm">
				<thead className="bg-muted/40 text-muted-foreground">
					<tr>
						<th className="px-4 py-2 text-left font-medium">
							{t("subjects.col_name", "Subject")}
						</th>
						<th className="px-4 py-2 text-left font-medium">
							{t("classes.col_name", "Class")}
						</th>
						<th className="px-4 py-2 text-left font-medium">
							{t("academic_years.col_name", "Academic year")}
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{assignments.map((a: any) => (
						<tr key={a.id} className="transition-colors hover:bg-muted/20">
							<td className="px-4 py-2 font-medium text-foreground">
								{a.subject?.name ?? a.subjectId}
							</td>
							<td className="px-4 py-2 text-muted-foreground">
								{a.class?.name ?? a.classId}
							</td>
							<td className="px-4 py-2 text-muted-foreground">
								{a.academicYear?.name ?? a.academicYearId}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
