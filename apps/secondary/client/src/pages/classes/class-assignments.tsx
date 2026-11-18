import { BookUser, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Confirm } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { subjectLabel } from "@/lib/subject-label";
import { AssignSubjectDialog } from "@/pages/subject-assignments/assign-subject-dialog";
import { trpc } from "@/utils/trpc";

export function ClassAssignments() {
	const { t, i18n } = useTranslation();
	const { id: classId } = useParams<{ id: string }>();
	const utils = trpc.useUtils();

	const { data: klass } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);
	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("nav.classes", "Classes"), href: "/classes" },
		{ label: klass?.name ?? "…", href: `/classes/${classId}` },
		{ label: t("classes.tab_assignments", "Teachers") },
	]);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: assignments = [], isLoading } =
		trpc.subjectAssignments.list.useQuery(
			{ academicYearId: yearId, classId: classId ?? undefined },
			{ enabled: !!yearId && !!classId },
		);

	const remove = trpc.subjectAssignments.delete.useMutation({
		onSuccess: () => utils.subjectAssignments.list.invalidate(),
		onError: (err) => errorToast(err, t),
	});

	type Assignment = (typeof assignments)[number];
	const existingSubjectIds = (assignments as Assignment[]).map(
		(a) => (a as { subject: { id: string } }).subject.id,
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="font-semibold text-foreground">
					{t("subject_assignments.title", "Subject Assignments")}
				</h2>
				<Button
					size="sm"
					onClick={() =>
						AssignSubjectDialog.call({
							classId: classId ?? "",
							academicYearId: yearId,
							existingSubjectIds,
						})
					}
					disabled={!yearId || !classId}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("subject_assignments.assign", "Assign")}
				</Button>
			</div>

			{isLoading ? (
				<div className="overflow-hidden rounded-xl border border-border">
					{Array.from({ length: 4 }, (_, i) => (
						<div
							key={i}
							className="flex items-center gap-4 border-border border-b px-4 py-3 last:border-0"
						>
							<Skeleton className="h-4 w-48" />
							<Skeleton className="ml-auto h-4 w-24" />
							<Skeleton className="h-7 w-7 rounded-full" />
						</div>
					))}
				</div>
			) : assignments.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
					<BookUser className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("subject_assignments.empty_title", "No subjects assigned yet")}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-3 text-left font-medium">
									{t("subject_assignments.col_subject", "Subject")}
								</th>
								<th className="px-4 py-3 text-left font-medium">
									{t("subject_assignments.col_teacher", "Teacher")}
								</th>
								<th className="w-12 px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{(assignments as Assignment[]).map((a) => {
								const staff = (
									a as {
										staff: { id: string; firstName: string; lastName: string };
									}
								).staff;
								const subject = (a as { subject: { id: string; name: string } })
									.subject;
								const id = (a as { assignment: { id: string } }).assignment.id;
								return (
									<tr key={id} className="transition-colors hover:bg-muted/20">
										<td className="px-4 py-3 font-medium text-foreground">
											{subjectLabel(subject, i18n.language)}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{staff.lastName} {staff.firstName}
										</td>
										<td className="px-4 py-3">
											<button
												type="button"
												onClick={async () => {
													const ok = await Confirm.call({
														title: t(
															"subject_assignments.delete_title",
															"Remove assignment?",
														),
														description: t(
															"subject_assignments.delete_desc",
															"This teacher will be unassigned from the subject.",
														),
														confirmLabel: t("common.delete", "Delete"),
														destructive: true,
													});
													if (!ok) return;
													remove.mutate({ id });
												}}
												className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
