import { zodResolver } from "@hookform/resolvers/zod";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { FormField } from "@/components/ui/form-field";
import { errorToast } from "@/lib/error-toast";
import { upsertInList } from "@/lib/query-cache";
import { subjectLabel } from "@/lib/subject-label";
import { StaffFormDialog } from "@/pages/staff-form-dialog";
import { SubjectFormDialog } from "@/pages/subject-form-dialog";
import { type RouterOutputs, trpc } from "@/utils/trpc";

const assignSchema = z.object({
	subjectId: z.string().uuid(),
	staffId: z.string().uuid(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

export type AssignSubjectResult = RouterOutputs["subjectAssignments"]["create"];

const SUBJECTS_INPUT = { page: 1, pageSize: 200 };
const STAFF_INPUT = { page: 1, pageSize: 200 };

interface Props {
	classId: string;
	academicYearId: string;
	/** Subjects already assigned to the class, hidden from the select. */
	existingSubjectIds: string[];
}

/**
 * Assigns a teacher to a subject for a class. Missing subjects and teachers
 * can be created in place through the "+" buttons next to each select.
 */
export const AssignSubjectDialog = createCallable<
	Props,
	AssignSubjectResult | undefined
>(({ call, classId, academicYearId, existingSubjectIds }) => {
	const { t, i18n } = useTranslation();
	const utils = trpc.useUtils();

	const { data: subjectsData } = trpc.subjects.list.useQuery(SUBJECTS_INPUT);
	const subjects = subjectsData?.items ?? [];

	const { data: staffData } = trpc.staff.list.useQuery(STAFF_INPUT);
	const staffList = staffData?.items ?? [];

	const assign = trpc.subjectAssignments.create.useMutation({
		onSuccess: () => utils.subjectAssignments.list.invalidate(),
	});

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<AssignFormValues>({
		resolver: zodResolver(assignSchema),
	});

	const createSubject = async () => {
		const subject = await SubjectFormDialog.call({});
		if (!subject) return;
		utils.subjects.list.setData(SUBJECTS_INPUT, (old) =>
			upsertInList(old, subject),
		);
		return { value: subject.id, label: subjectLabel(subject, i18n.language) };
	};

	const createTeacher = async () => {
		const member = await StaffFormDialog.call({ defaultRole: "teacher" });
		if (!member) return;
		utils.staff.list.setData(STAFF_INPUT, (old) => upsertInList(old, member));
		return {
			value: member.id,
			label: `${member.lastName} ${member.firstName}`,
		};
	};

	const submit = useMutationFlow(call, async (call, data: AssignFormValues) => {
		try {
			call.end(await assign.mutateAsync({ ...data, classId, academicYearId }));
		} catch (err) {
			errorToast(err, t);
		}
	});

	const availableSubjects = subjects.filter(
		(s) => !existingSubjectIds.includes(s.id),
	);

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="max-w-sm"
			title={t("subject_assignments.assign", "Assign subject")}
		>
			<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
				<FormField
					label={t("subject_assignments.col_subject", "Subject")}
					error={errors.subjectId?.message}
					required
				>
					<Controller
						name="subjectId"
						control={control}
						render={({ field }) => (
							<CreatableCombobox
								options={availableSubjects.map((s) => ({
									value: s.id,
									label: subjectLabel(s, i18n.language),
								}))}
								value={field.value ?? ""}
								onValueChange={field.onChange}
								placeholder={t("common.select", "Select…")}
								onCreate={createSubject}
								createLabel={t("subjects.add", "Add subject")}
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
							<CreatableCombobox
								options={staffList.map((m) => ({
									value: m.id,
									label: `${m.lastName} ${m.firstName}`,
								}))}
								value={field.value ?? ""}
								onValueChange={field.onChange}
								placeholder={t("common.select", "Select…")}
								onCreate={createTeacher}
								createLabel={t("staff.add", "Add staff member")}
							/>
						)}
					/>
				</FormField>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{t("subject_assignments.assign", "Assign")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
