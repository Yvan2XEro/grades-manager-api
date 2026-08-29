import { zodResolver } from "@hookform/resolvers/zod";
import { BookUser, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { trpc } from "@/utils/trpc";

// ─── Assign dialog ────────────────────────────────────────────────────────────

const assignSchema = z.object({
	subjectId: z.string().uuid(),
	staffId: z.string().uuid(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface AssignDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	classId: string;
	academicYearId: string;
	existingSubjectIds: string[];
}

function AssignDialog({
	open,
	onOpenChange,
	classId,
	academicYearId,
	existingSubjectIds,
}: AssignDialogProps) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data: subjectsData } = trpc.subjects.list.useQuery({
		page: 1,
		pageSize: 200,
	});
	const subjects = subjectsData?.items ?? [];

	const { data: staffData } = trpc.staff.list.useQuery({
		page: 1,
		pageSize: 200,
	});
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
	} = useForm<AssignFormValues>({
		resolver: zodResolver(assignSchema),
	});

	const onSubmit = handleSubmit(async (data) => {
		await assign.mutateAsync({
			subjectId: data.subjectId,
			staffId: data.staffId,
			classId,
			academicYearId,
		});
	});

	const availableSubjects = subjects.filter(
		(s) => !existingSubjectIds.includes(s.id),
	);

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
									options={availableSubjects.map((s) => ({
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
						<p className="text-destructive text-sm">
							{assign.error.message ?? t("common.error", "An error occurred")}
						</p>
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

// ─── Main page ────────────────────────────────────────────────────────────────

type Assignment = {
	assignment: {
		id: string;
		staffId: string;
		subjectId: string;
		classId: string;
		academicYearId: string;
	};
	staff: { id: string; firstName: string; lastName: string; email: string };
	subject: {
		id: string;
		name: string;
		nameFr: string | null;
		code: string | null;
	};
	class: {
		id: string;
		name: string;
		code: string | null;
		level: string | null;
	};
};

export function SubjectAssignments() {
	const { t } = useTranslation();
	const [selectedClassId, setSelectedClassId] = useState<string>("");
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const utils = trpc.useUtils();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId: yearId, page: 1, pageSize: 100 },
		{ enabled: !!yearId },
	);
	const classes = classesData?.items ?? [];

	const classId = selectedClassId || classes[0]?.id || "";

	const { data: assignments = [], isLoading } =
		trpc.subjectAssignments.list.useQuery(
			{ academicYearId: yearId, classId: classId || undefined },
			{ enabled: !!yearId },
		);

	const remove = trpc.subjectAssignments.delete.useMutation({
		onSuccess: () => {
			utils.subjectAssignments.list.invalidate();
			setPendingDeleteId(null);
		},
	});

	const existingSubjectIds = (assignments as Assignment[]).map(
		(a) => a.subject.id,
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("subject_assignments.title", "Subject Assignments")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"subject_assignments.subtitle",
							"Assign teachers to subjects per class",
						)}
					</p>
				</div>
				<Button
					onClick={() => setAssignDialogOpen(true)}
					disabled={!yearId || !classId}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("subject_assignments.assign", "Assign")}
				</Button>
			</div>

			<div className="w-56">
				<label className="mb-1 block font-medium text-muted-foreground text-xs">
					{t("subject_assignments.select_class", "Class")}
				</label>
				<Combobox
					options={classes.map((c) => ({ value: c.id, label: c.name }))}
					value={classId}
					onValueChange={setSelectedClassId}
					placeholder={t("subject_assignments.select_class", "Select class…")}
					disabled={!yearId || classes.length === 0}
				/>
			</div>

			{!yearId || !classId ? (
				<div className="rounded-xl border border-border bg-muted/30 p-10 text-center text-muted-foreground">
					{t(
						"subject_assignments.select_class",
						"Select a class to view assignments",
					)}
				</div>
			) : isLoading ? (
				<div className="space-y-2">
					{[1, 2, 3, 4].map((n) => (
						<div
							key={n}
							className="h-12 animate-pulse rounded-lg border border-border bg-muted/20"
						/>
					))}
				</div>
			) : (assignments as Assignment[]).length === 0 ? (
				<div className="rounded-xl border border-border bg-muted/30 p-10 text-center">
					<BookUser className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						{t(
							"subject_assignments.unassigned",
							"No subjects assigned for this class",
						)}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-3 text-left font-medium text-foreground">
									{t("subject_assignments.col_subject", "Subject")}
								</th>
								<th className="px-4 py-3 text-left font-medium text-foreground">
									{t("subject_assignments.col_teacher", "Teacher")}
								</th>
								<th className="px-4 py-3 text-right font-medium text-foreground">
									{t("common.actions", "Actions")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{(assignments as Assignment[]).map((a) => (
								<tr
									key={a.assignment.id}
									className="transition-colors hover:bg-muted/20"
								>
									<td className="px-4 py-3">
										<span className="font-medium text-foreground">
											{a.subject.name}
										</span>
										{a.subject.code && (
											<Badge className="ml-2 bg-muted text-muted-foreground text-xs">
												{a.subject.code}
											</Badge>
										)}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{a.staff.lastName} {a.staff.firstName}
									</td>
									<td className="px-4 py-3 text-right">
										{pendingDeleteId === a.assignment.id ? (
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="destructive"
													size="sm"
													className="h-7 px-2 text-xs"
													onClick={() => remove.mutate({ id: a.assignment.id })}
													disabled={remove.isPending}
												>
													{t("common.confirm", "Confirm")}
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 px-2 text-xs"
													onClick={() => setPendingDeleteId(null)}
												>
													{t("common.cancel", "Cancel")}
												</Button>
											</div>
										) : (
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-destructive hover:text-destructive"
												onClick={() => setPendingDeleteId(a.assignment.id)}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{yearId && classId && (
				<AssignDialog
					open={assignDialogOpen}
					onOpenChange={setAssignDialogOpen}
					classId={classId}
					academicYearId={yearId}
					existingSubjectIds={existingSubjectIds}
				/>
			)}
		</div>
	);
}
