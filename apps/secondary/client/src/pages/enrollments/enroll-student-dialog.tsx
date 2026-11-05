import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus, Search } from "lucide-react";
import { useState } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { errorToast } from "@/lib/error-toast";
import { upsertInList } from "@/lib/query-cache";
import { cn } from "@/lib/utils";
import { ClassFormDialog } from "@/pages/classes/class-form-dialog";
import { StudentFormDialog } from "@/pages/students/student-form-dialog";
import { type RouterOutputs, trpc } from "@/utils/trpc";

const schema = z.object({
	studentId: z.string().uuid({ message: "Select a student" }),
	academicYearId: z.string().uuid({ message: "Select an academic year" }),
	classId: z.string().uuid({ message: "Select a class" }),
	admissionType: z.enum(["new", "transfer", "repeat", "promoted"]),
});
type FormValues = z.infer<typeof schema>;

export type EnrollStudentResult = RouterOutputs["enrollments"]["create"];

interface Props {
	/** Enrolls this student; otherwise the dialog lets the user search one. */
	studentId?: string;
	/** Fixes the academic year; otherwise the dialog shows a year select. */
	academicYearId?: string;
}

/**
 * Enrolls a student in a class. The class select depends on the chosen year,
 * and a missing class (or student) can be created in place from the "+".
 */
export const EnrollStudentDialog = createCallable<
	Props,
	EnrollStudentResult | undefined
>(({ call, studentId, academicYearId: fixedYearId }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const [search, setSearch] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);

	const {
		handleSubmit,
		setValue,
		watch,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			studentId: studentId ?? "",
			academicYearId: fixedYearId ?? "",
			classId: "",
			admissionType: "new",
		},
	});

	const selectedStudentId = watch("studentId");
	const academicYearId = watch("academicYearId");

	const { data: years = [] } = trpc.academicYears.list.useQuery(undefined, {
		enabled: !fixedYearId,
	});

	const { data: studentsData } = trpc.students.list.useQuery(
		{ search: search || undefined, pageSize: 20 },
		{ enabled: !studentId && search.length >= 1 },
	);
	const students = studentsData?.items ?? [];

	const classesInput = { academicYearId, pageSize: 200 };
	const { data: classesData } = trpc.classes.list.useQuery(classesInput, {
		enabled: !!academicYearId,
	});
	const classes = classesData?.items ?? [];

	const enroll = trpc.enrollments.create.useMutation({
		onSuccess: () => {
			utils.enrollments.list.invalidate();
			utils.classes.list.invalidate();
		},
	});

	const selectStudent = (student: {
		id: string;
		firstName: string;
		lastName: string;
	}) => {
		setValue("studentId", student.id, { shouldValidate: true });
		setSearch(`${student.lastName} ${student.firstName}`);
		setShowDropdown(false);
	};

	const createStudent = async () => {
		const student = await StudentFormDialog.call({});
		if (student) selectStudent(student);
	};

	const createClass = async () => {
		const created = await ClassFormDialog.call({
			defaults: { academicYearId },
			lockAcademicYear: true,
		});
		if (!created) return;
		utils.classes.list.setData(classesInput, (old) =>
			upsertInList(old, { ...created, studentCount: 0 }),
		);
		return { value: created.id, label: created.name };
	};

	const submit = useMutationFlow(call, async (call, values: FormValues) => {
		try {
			call.end(await enroll.mutateAsync(values));
		} catch (err) {
			errorToast(err, t);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="max-w-md"
			title={
				studentId
					? t("enrollments.create_title", "Enroll in Class")
					: t("enrollments.enroll_existing_title", "Enroll existing student")
			}
			description={
				studentId
					? undefined
					: t(
							"enrollments.enroll_existing_desc",
							"Search for an existing student and assign them to a class for the active year.",
						)
			}
		>
			<form onSubmit={handleSubmit(submit)} className="space-y-4 pt-1">
				{!studentId && (
					<FormField
						label={t("enrollments.field_student", "Student")}
						error={errors.studentId?.message}
					>
						<div className="flex items-center gap-2">
							<div className="relative min-w-0 flex-1">
								<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder={t(
										"enrollments.student_search_placeholder",
										"Search by name or MNU…",
									)}
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setValue("studentId", "");
										setShowDropdown(true);
									}}
									onFocus={() => search && setShowDropdown(true)}
									className="pl-9"
									autoComplete="off"
								/>
								{showDropdown && students.length > 0 && (
									<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
										{students.map((s) => (
											<button
												key={s.id}
												type="button"
												onClick={() => selectStudent(s)}
												className={cn(
													"flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
													s.id === selectedStudentId && "bg-accent",
												)}
											>
												{s.id === selectedStudentId && (
													<Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
												)}
												<span
													className={
														s.id === selectedStudentId ? "ml-0" : "ml-5.5"
													}
												>
													<span className="font-medium">
														{s.lastName} {s.firstName}
													</span>
													{s.mnu && (
														<span className="ml-2 font-mono text-muted-foreground text-xs">
															{s.mnu}
														</span>
													)}
												</span>
											</button>
										))}
									</div>
								)}
								{showDropdown &&
									search.length >= 1 &&
									students.length === 0 && (
										<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-4 text-center text-muted-foreground text-sm shadow-md">
											{t("students.no_results", "No students found")}
										</div>
									)}
							</div>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="shrink-0"
								onClick={createStudent}
								aria-label={t("students.add", "Add student")}
								title={t("students.add", "Add student")}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</FormField>
				)}

				{!fixedYearId && (
					<FormField
						label={t("enrollments.field_year", "Academic Year")}
						error={errors.academicYearId?.message}
					>
						<Controller
							name="academicYearId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={years.map((y) => ({ value: y.id, label: y.name }))}
									value={field.value}
									onValueChange={(val) => {
										field.onChange(val);
										setValue("classId", "");
									}}
									placeholder={t("common.select", "Select…")}
								/>
							)}
						/>
					</FormField>
				)}

				<FormField
					label={t("enrollments.field_class", "Class")}
					error={errors.classId?.message}
				>
					<Controller
						name="classId"
						control={control}
						render={({ field }) => (
							<CreatableCombobox
								options={classes.map((c) => ({ value: c.id, label: c.name }))}
								value={field.value}
								onValueChange={(val) =>
									setValue("classId", val, { shouldValidate: true })
								}
								placeholder={t("enrollments.col_class", "Select class")}
								disabled={!academicYearId}
								onCreate={createClass}
								createLabel={t("classes.add", "Add class")}
							/>
						)}
					/>
				</FormField>

				<FormField
					label={t("enrollments.field_admission_type", "Admission type")}
					error={errors.admissionType?.message}
				>
					<Controller
						name="admissionType"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="new">
										{t("enrollments.type_new", "New")}
									</SelectItem>
									<SelectItem value="promoted">
										{t("enrollments.type_promoted", "Promoted")}
									</SelectItem>
									<SelectItem value="repeat">
										{t("enrollments.type_repeat", "Repeating")}
									</SelectItem>
									<SelectItem value="transfer">
										{t("enrollments.type_transfer", "Transfer")}
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</FormField>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{submit.pending
							? t("enrollments.enrolling", "Enrolling…")
							: t("enrollments.enroll_btn", "Enroll")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
