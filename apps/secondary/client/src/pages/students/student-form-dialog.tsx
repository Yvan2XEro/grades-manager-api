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
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { errorToast } from "@/lib/error-toast";
import { upsertInList } from "@/lib/query-cache";
import { ClassFormDialog } from "@/pages/classes/class-form-dialog";
import { type RouterOutputs, trpc } from "@/utils/trpc";

const schema = z.object({
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	gender: z.enum(["M", "F"]).optional(),
	mnu: z.string().max(50).optional(),
	registrationNumber: z.string().max(50).optional(),
	dateOfBirth: z.string().optional(),
	placeOfBirth: z.string().max(100).optional(),
	contactName: z.string().max(200).optional(),
	contactPhone: z.string().max(30).optional(),
	contactEmail: z.string().optional(),
	contactRelation: z.enum(["father", "mother", "guardian"]).optional(),
	reportCardLanguage: z.enum(["fr", "en"]),
	// Only used for creation — class to enroll the student into
	classId: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StudentData {
	id: string;
	firstName: string;
	lastName: string;
	gender?: string | null;
	mnu?: string | null;
	registrationNumber?: string | null;
	dateOfBirth?: Date | string | null;
	placeOfBirth?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	contactRelation?: string | null;
	reportCardLanguage?: string | null;
}

export type StudentFormResult = RouterOutputs["students"]["create"];

interface Props {
	student?: StudentData;
	/** Enables the class enrollment step on creation. */
	activeYearId?: string;
}

/**
 * Resolves with the saved student, or `undefined` when dismissed. On creation
 * the student can be enrolled right away in a class of the active year — and
 * that class can be created in place from the "+" next to the select.
 */
export const StudentFormDialog = createCallable<
	Props,
	StudentFormResult | undefined
>(({ call, student, activeYearId }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const isNew = !student;

	const classesInput = { academicYearId: activeYearId, pageSize: 200 };
	const { data: classesData } = trpc.classes.list.useQuery(classesInput, {
		enabled: isNew && !!activeYearId,
	});
	const classes = classesData?.items ?? [];

	const enroll = trpc.enrollments.create.useMutation();
	const create = trpc.students.create.useMutation();
	const update = trpc.students.update.useMutation();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: student
			? {
					firstName: student.firstName,
					lastName: student.lastName,
					gender: (student.gender as "M" | "F" | undefined) ?? undefined,
					mnu: student.mnu ?? "",
					registrationNumber: student.registrationNumber ?? "",
					dateOfBirth: student.dateOfBirth
						? new Date(student.dateOfBirth).toISOString().split("T")[0]
						: "",
					placeOfBirth: student.placeOfBirth ?? "",
					contactName: student.contactName ?? "",
					contactPhone: student.contactPhone ?? "",
					contactEmail: student.contactEmail ?? "",
					contactRelation:
						(student.contactRelation as
							| "father"
							| "mother"
							| "guardian"
							| undefined) ?? undefined,
					reportCardLanguage:
						(student.reportCardLanguage as "fr" | "en") ?? "fr",
				}
			: { reportCardLanguage: "fr" as const },
	});

	const createClass = async () => {
		if (!activeYearId) return;
		const created = await ClassFormDialog.call({
			defaults: { academicYearId: activeYearId },
			lockAcademicYear: true,
		});
		if (!created) return;
		utils.classes.list.setData(classesInput, (old) =>
			upsertInList(old, { ...created, studentCount: 0 }),
		);
		return { value: created.id, label: created.name };
	};

	const submit = useMutationFlow(call, async (call, data: FormValues) => {
		const payload = {
			firstName: data.firstName,
			lastName: data.lastName,
			gender: data.gender || undefined,
			mnu: data.mnu || undefined,
			registrationNumber: data.registrationNumber || undefined,
			dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
			placeOfBirth: data.placeOfBirth || undefined,
			contactName: data.contactName || undefined,
			contactPhone: data.contactPhone || undefined,
			contactEmail: data.contactEmail || undefined,
			contactRelation: data.contactRelation || undefined,
			reportCardLanguage: data.reportCardLanguage,
		};

		try {
			if (student) {
				const saved = await update.mutateAsync({ id: student.id, ...payload });
				utils.students.list.invalidate();
				call.end(saved);
				return;
			}
			const created = await create.mutateAsync(payload);
			if (data.classId && activeYearId) {
				await enroll.mutateAsync({
					studentId: created.id,
					classId: data.classId,
					academicYearId: activeYearId,
					admissionType: "new",
				});
				utils.enrollments.list.invalidate();
				utils.classes.list.invalidate();
			}
			utils.students.list.invalidate();
			call.end(created);
		} catch (err) {
			errorToast(err, t);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="max-h-[90vh] max-w-xl overflow-y-auto"
			title={
				student
					? t("students.edit", "Edit student")
					: t("students.add", "Add student")
			}
		>
			<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-3">
					<FormField
						label={t("students.first_name", "First name")}
						error={errors.firstName?.message}
						required
					>
						<Input {...register("firstName")} />
					</FormField>
					<FormField
						label={t("students.last_name", "Last name")}
						error={errors.lastName?.message}
						required
					>
						<Input {...register("lastName")} />
					</FormField>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<FormField
						label={t("students.col_gender", "Gender")}
						error={errors.gender?.message}
					>
						<Controller
							name="gender"
							control={control}
							render={({ field }) => (
								<Select
									value={field.value ?? ""}
									onValueChange={(val) =>
										field.onChange(
											val === "" ? undefined : (val as FormValues["gender"]),
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="M">
											{t("students.gender_m", "Male")}
										</SelectItem>
										<SelectItem value="F">
											{t("students.gender_f", "Female")}
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</FormField>
					<FormField label="MNU" error={errors.mnu?.message}>
						<Input {...register("mnu")} />
					</FormField>
				</div>

				{/* Class enrollment — new students only, when year is available */}
				{isNew && activeYearId && (
					<FormField
						label={t("students.enroll_class", "Enroll in class")}
						error={errors.classId?.message}
					>
						<Controller
							name="classId"
							control={control}
							render={({ field }) => (
								<CreatableCombobox
									options={[
										{
											value: "none",
											label: t(
												"students.no_class_yet",
												"— No class (enroll later) —",
											),
										},
										...classes.map((c) => ({ value: c.id, label: c.name })),
									]}
									value={field.value ?? "none"}
									onValueChange={(val) =>
										field.onChange(val === "none" ? undefined : val)
									}
									placeholder={t("students.select_class", "Select a class…")}
									clearable={false}
									onCreate={createClass}
									createLabel={t("classes.add", "Add class")}
								/>
							)}
						/>
					</FormField>
				)}

				<div className="grid grid-cols-2 gap-3">
					<FormField
						label={t("students.date_of_birth", "Date of birth")}
						error={errors.dateOfBirth?.message}
					>
						<Controller
							name="dateOfBirth"
							control={control}
							render={({ field }) => (
								<DatePicker
									value={field.value ?? ""}
									onChange={field.onChange}
									startMonth={new Date(1940, 0)}
									endMonth={new Date()}
								/>
							)}
						/>
					</FormField>
					<FormField
						label={t("students.place_of_birth", "Place of birth")}
						error={errors.placeOfBirth?.message}
					>
						<Input {...register("placeOfBirth")} />
					</FormField>
				</div>

				<div className="border-border border-t pt-3">
					<p className="mb-2 font-medium text-foreground text-sm">
						{t("students.contact_info", "Contact information")}
					</p>
					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("students.contact_name", "Contact name")}
							error={errors.contactName?.message}
						>
							<Input {...register("contactName")} />
						</FormField>
						<FormField
							label={t("students.contact_phone", "Contact phone")}
							error={errors.contactPhone?.message}
						>
							<Controller
								name="contactPhone"
								control={control}
								render={({ field }) => (
									<PhoneInput
										defaultCountry="CM"
										value={field.value ?? ""}
										onChange={field.onChange}
									/>
								)}
							/>
						</FormField>
						<FormField
							label={t("students.contact_email", "Contact email")}
							error={errors.contactEmail?.message}
						>
							<Input type="email" {...register("contactEmail")} />
						</FormField>
						<FormField
							label={t("students.contact_relation", "Relationship")}
							error={errors.contactRelation?.message}
						>
							<Controller
								name="contactRelation"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value ?? ""}
										onValueChange={(val) =>
											field.onChange(
												val === ""
													? undefined
													: (val as FormValues["contactRelation"]),
											)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="father">
												{t("students.relation_father", "Father")}
											</SelectItem>
											<SelectItem value="mother">
												{t("students.relation_mother", "Mother")}
											</SelectItem>
											<SelectItem value="guardian">
												{t("students.relation_guardian", "Guardian")}
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
					</div>
				</div>

				<FormField
					label={t("students.report_card_language", "Report card language")}
					error={errors.reportCardLanguage?.message}
				>
					<Controller
						name="reportCardLanguage"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fr">Français</SelectItem>
									<SelectItem value="en">English</SelectItem>
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
						{student
							? t("common.save", "Save")
							: t("students.add", "Add student")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
