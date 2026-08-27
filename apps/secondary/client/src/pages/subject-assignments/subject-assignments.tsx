import { zodResolver } from "@hookform/resolvers/zod";
import { BookUser, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectOption } from "@/components/ui/select";
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
		register,
		handleSubmit,
		reset,
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
						<Select {...register("subjectId")}>
							<SelectOption value="">—</SelectOption>
							{availableSubjects.map((s) => (
								<SelectOption key={s.id} value={s.id}>
									{s.name}
								</SelectOption>
							))}
						</Select>
					</FormField>

					<FormField
						label={t("subject_assignments.col_teacher", "Teacher")}
						error={errors.staffId?.message}
						required
					>
						<Select {...register("staffId")}>
							<SelectOption value="">—</SelectOption>
							{staffList.map((m) => (
								<SelectOption key={m.id} value={m.id}>
									{m.lastName} {m.firstName}
								</SelectOption>
							))}
						</Select>
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
	const [selectedYearId, setSelectedYearId] = useState<string>("");
	const [selectedClassId, setSelectedClassId] = useState<string>("");
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const utils = trpc.useUtils();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const yearId = selectedYearId || years[0]?.id || "";

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
		onSuccess: () => utils.subjectAssignments.list.invalidate(),
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

			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-2">
					<label className="whitespace-nowrap font-medium text-foreground text-sm">
						{t("terms.select_year", "Academic year")}
					</label>
					<Select
						className="w-40"
						value={yearId}
						onChange={(e) => {
							setSelectedYearId(e.target.value);
							setSelectedClassId("");
						}}
					>
						{years.map((y) => (
							<SelectOption key={y.id} value={y.id}>
								{y.name}
							</SelectOption>
						))}
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<label className="whitespace-nowrap font-medium text-foreground text-sm">
						{t("subject_assignments.select_class", "Class")}
					</label>
					<Select
						className="w-40"
						value={classId}
						onChange={(e) => setSelectedClassId(e.target.value)}
						disabled={!yearId || classes.length === 0}
					>
						<SelectOption value="">—</SelectOption>
						{classes.map((c) => (
							<SelectOption key={c.id} value={c.id}>
								{c.name}
							</SelectOption>
						))}
					</Select>
				</div>
			</div>

			{!yearId || !classId ? (
				<div className="rounded-xl border border-border bg-muted/30 p-10 text-center text-muted-foreground">
					{t(
						"subject_assignments.select_class",
						"Select a year and class to view assignments",
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
						<thead className="bg-muted/50">
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
										<Button
											variant="ghost"
											size="sm"
											className="h-7 px-2 text-destructive hover:text-destructive"
											onClick={() => remove.mutate({ id: a.assignment.id })}
											disabled={remove.isPending}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
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
