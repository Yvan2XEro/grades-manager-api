import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

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
});

type FormValues = z.infer<typeof schema>;

interface StudentData {
	id: string;
	firstName: string;
	lastName: string;
	gender?: string | null;
	mnu?: string | null;
	registrationNumber?: string | null;
	dateOfBirth?: Date | null;
	placeOfBirth?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	contactRelation?: string | null;
	reportCardLanguage?: string | null;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	student?: StudentData;
}

export function StudentFormDialog({
	open,
	onOpenChange,
	onSuccess,
	student,
}: Props) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.students.create.useMutation({
		onSuccess: () => {
			utils.students.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
	});

	const update = trpc.students.update.useMutation({
		onSuccess: () => {
			utils.students.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
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

	const onSubmit = handleSubmit(async (data) => {
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

		if (student) {
			await update.mutateAsync({ id: student.id, ...payload });
		} else {
			await create.mutateAsync(payload);
		}
	});

	const handleOpenChange = (open: boolean) => {
		if (!open) reset();
		onOpenChange(open);
	};

	const mutationError = create.error ?? update.error;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{student
							? t("students.edit", "Edit student")
							: t("students.add", "Add student")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
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
							<Select {...register("gender")}>
								<SelectOption value="">—</SelectOption>
								<SelectOption value="M">
									{t("students.gender_m", "Male")}
								</SelectOption>
								<SelectOption value="F">
									{t("students.gender_f", "Female")}
								</SelectOption>
							</Select>
						</FormField>
						<FormField label="MNU" error={errors.mnu?.message}>
							<Input {...register("mnu")} />
						</FormField>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("students.date_of_birth", "Date of birth")}
							error={errors.dateOfBirth?.message}
						>
							<Input type="date" {...register("dateOfBirth")} />
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
								<Select {...register("contactRelation")}>
									<SelectOption value="">—</SelectOption>
									<SelectOption value="father">
										{t("students.relation_father", "Father")}
									</SelectOption>
									<SelectOption value="mother">
										{t("students.relation_mother", "Mother")}
									</SelectOption>
									<SelectOption value="guardian">
										{t("students.relation_guardian", "Guardian")}
									</SelectOption>
								</Select>
							</FormField>
						</div>
					</div>

					<FormField
						label={t("students.report_card_language", "Report card language")}
						error={errors.reportCardLanguage?.message}
					>
						<Select {...register("reportCardLanguage")}>
							<SelectOption value="fr">Français</SelectOption>
							<SelectOption value="en">English</SelectOption>
						</Select>
					</FormField>

					{mutationError && (
						<p className="text-destructive text-sm">
							{mutationError.message ?? t("common.error", "An error occurred")}
						</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{student
								? t("common.save", "Save")
								: t("students.add", "Add student")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
