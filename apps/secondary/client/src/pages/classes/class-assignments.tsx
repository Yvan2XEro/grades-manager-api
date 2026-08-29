import { zodResolver } from "@hookform/resolvers/zod";
import { BookUser, Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

const assignSchema = z.object({
	subjectId: z.string().uuid(),
	staffId: z.string().uuid(),
});
type AssignFormValues = z.infer<typeof assignSchema>;

function AssignDialog({
	open,
	onOpenChange,
	classId,
	academicYearId,
	existingSubjectIds,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	classId: string;
	academicYearId: string;
	existingSubjectIds: string[];
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const subjects = subjectsData?.items ?? [];
	const { data: staffData } = trpc.staff.list.useQuery({ pageSize: 200 });
	const staffList = staffData?.items ?? [];

	const assign = trpc.subjectAssignments.create.useMutation({
		onSuccess: () => {
			utils.subjectAssignments.list.invalidate();
			onOpenChange(false);
			reset();
		},
	});

	const {
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<AssignFormValues>({ resolver: zodResolver(assignSchema) });

	const onSubmit = handleSubmit(async (data) => {
		await assign.mutateAsync({ ...data, classId, academicYearId });
	});

	const available = subjects.filter((s) => !existingSubjectIds.includes(s.id));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t("subject_assignments.assign", "Assign subject")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<FormField
						label={t("subject_assignments.col_subject", "Subject")}
						error={errors.subjectId?.message}
						required
					>
						<Controller
							name="subjectId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={available.map((s) => ({
										value: s.id,
										label: s.name,
									}))}
									value={field.value ?? ""}
									onValueChange={field.onChange}
									placeholder={t("common.select", "Select…")}
								/>
							)}
						/>
					</FormField>
					<FormField
						label={t("subject_assignments.col_teacher", "Teacher")}
						error={errors.staffId?.message}
						required
					>
						<Controller
							name="staffId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={staffList.map((m) => ({
										value: m.id,
										label: `${m.lastName} ${m.firstName}`,
									}))}
									value={field.value ?? ""}
									onValueChange={field.onChange}
									placeholder={t("common.select", "Select…")}
								/>
							)}
						/>
					</FormField>
					{assign.error && (
						<p className="text-destructive text-sm">{assign.error.message}</p>
					)}
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{t("subject_assignments.assign", "Assign")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function ClassAssignments() {
	const { t } = useTranslation();
	const { id: classId } = useParams<{ id: string }>();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const utils = trpc.useUtils();

	const { data: klass } = trpc.classes.get.useQuery(
		{ id: classId! },
		{ enabled: !!classId },
	);
	useBreadcrumbs([
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
		onSuccess: () => {
			utils.subjectAssignments.list.invalidate();
			setPendingDeleteId(null);
		},
	});

	type Assignment = (typeof assignments)[number];
	const existingSubjectIds = (assignments as Assignment[]).map(
		(a) => (a as { subject: { id: string } }).subject.id,
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-foreground">
					{t("subject_assignments.title", "Subject Assignments")}
				</h2>
				<Button
					size="sm"
					onClick={() => setDialogOpen(true)}
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
											{subject.name}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{staff.lastName} {staff.firstName}
										</td>
										<td className="px-4 py-3">
											{pendingDeleteId === id ? (
												<div className="flex items-center gap-1">
													<button
														type="button"
														onClick={() => remove.mutate({ id })}
														disabled={remove.isPending}
														className="rounded p-1 text-destructive transition-colors hover:bg-destructive/10"
													>
														<Check className="h-4 w-4" />
													</button>
													<button
														type="button"
														onClick={() => setPendingDeleteId(null)}
														className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
													>
														<X className="h-4 w-4" />
													</button>
												</div>
											) : (
												<button
													type="button"
													onClick={() => setPendingDeleteId(id)}
													className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			<AssignDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				classId={classId ?? ""}
				academicYearId={yearId}
				existingSubjectIds={existingSubjectIds}
			/>
		</div>
	);
}
