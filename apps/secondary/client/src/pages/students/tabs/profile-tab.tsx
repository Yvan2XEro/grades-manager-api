import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

type StudentData = {
	id: string;
	firstName: string;
	lastName: string;
	registrationNumber?: string | null;
	mnu?: string | null;
	gender?: string | null;
	dateOfBirth?: Date | string | null;
	placeOfBirth?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	contactRelation?: string | null;
	reportCardLanguage?: string | null;
};

const editSchema = z.object({
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
});
type EditFormValues = z.infer<typeof editSchema>;

function InfoRow({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</span>
			<span className="text-foreground text-sm">{value || "—"}</span>
		</div>
	);
}

function studentToFormValues(student: StudentData): EditFormValues {
	return {
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
			(student.reportCardLanguage as "fr" | "en" | null | undefined) ?? "fr",
	};
}

export function StudentProfileTab() {
	const { t } = useTranslation();
	const student = useOutletContext<StudentData>();
	const [isEditing, setIsEditing] = useState(false);
	const utils = trpc.useUtils();

	useBreadcrumbs([
		{ label: t("nav.students", "Students"), href: "/students" },
		{
			label: `${student.firstName} ${student.lastName}`,
			href: `/students/${student.id}`,
		},
		{ label: t("students.tab_profile", "Profile") },
	]);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<EditFormValues>({
		resolver: zodResolver(editSchema),
		defaultValues: studentToFormValues(student),
	});

	const update = trpc.students.update.useMutation({
		onSuccess: () => {
			utils.students.get.invalidate({ id: student.id });
			utils.students.list.invalidate();
			setIsEditing(false);
		},
	});

	const handleEdit = () => {
		reset(studentToFormValues(student));
		setIsEditing(true);
	};

	const onSubmit = handleSubmit(async (data) => {
		await update.mutateAsync({
			id: student.id,
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
		});
	});

	const formatDate = (value: Date | string | null | undefined) => {
		if (!value) return "—";
		return new Date(value).toLocaleDateString();
	};

	const genderLabel = (g: string | null | undefined) => {
		if (!g) return "—";
		if (g === "M") return t("students.gender_m");
		if (g === "F") return t("students.gender_f");
		return g;
	};

	const langLabel = (l: string | null | undefined) => {
		if (!l) return "—";
		if (l === "fr") return "Français";
		if (l === "en") return "English";
		return l;
	};

	if (isEditing) {
		return (
			<form onSubmit={onSubmit} className="space-y-6">
				<div className="flex items-center justify-between">
					<p className="font-medium text-foreground text-sm">
						{t("students.edit", "Edit student")}
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(false)}
						>
							<X className="mr-1.5 h-3.5 w-3.5" />
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" size="sm" disabled={isSubmitting}>
							{isSubmitting
								? t("common.saving", "Saving…")
								: t("common.save", "Save")}
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{/* Identity */}
					<div className="space-y-4 rounded-xl border border-border p-5">
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
													val === "" ? undefined : (val as "M" | "F"),
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
						<FormField
							label={t("students.registration_number", "Reg. number")}
							error={errors.registrationNumber?.message}
						>
							<Input {...register("registrationNumber")} />
						</FormField>
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
					</div>

					{/* Contact + preferences */}
					<div className="space-y-4 rounded-xl border border-border p-5">
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
							<Input {...register("contactPhone")} />
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
													: (val as "father" | "mother" | "guardian"),
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
					</div>
				</div>

				{update.error && (
					<p className="text-destructive text-sm">{update.error.message}</p>
				)}
			</form>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button variant="outline" size="sm" onClick={handleEdit}>
					<Pencil className="mr-1.5 h-3.5 w-3.5" />
					{t("common.edit", "Edit")}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div className="space-y-5 rounded-xl border border-border p-5">
					<InfoRow
						label={t("students.registration_number")}
						value={student.registrationNumber}
					/>
					<InfoRow label={t("students.mnu")} value={student.mnu} />
					<InfoRow
						label={t("students.gender")}
						value={genderLabel(student.gender)}
					/>
					<InfoRow
						label={t("students.dob")}
						value={formatDate(student.dateOfBirth)}
					/>
					<InfoRow label={t("students.pob")} value={student.placeOfBirth} />
				</div>

				<div className="space-y-5 rounded-xl border border-border p-5">
					<InfoRow
						label={t("students.contact_name")}
						value={student.contactName}
					/>
					<InfoRow
						label={t("students.contact_phone")}
						value={student.contactPhone}
					/>
					<InfoRow
						label={t("students.contact_email")}
						value={student.contactEmail}
					/>
					<InfoRow
						label={t("students.contact_relation")}
						value={student.contactRelation}
					/>
					<InfoRow
						label={t("students.report_card_language")}
						value={langLabel(student.reportCardLanguage)}
					/>
				</div>
			</div>
		</div>
	);
}
