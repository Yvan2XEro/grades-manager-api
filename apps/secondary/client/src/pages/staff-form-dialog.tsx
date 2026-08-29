import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

const ROLES = [
	"teacher",
	"admin",
	"principal",
	"vice_principal",
	"staff",
] as const;

const schema = z.object({
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	email: z.string().email().max(255),
	phone: z.string().max(30).optional(),
	role: z.enum(ROLES).optional(),
});

type FormValues = z.infer<typeof schema>;

interface StaffMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string | null;
	role?: string | null;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	staff?: StaffMember;
}

const ROLE_LABELS: Record<string, string> = {
	teacher: "Teacher",
	admin: "Administrator",
	principal: "Principal",
	vice_principal: "Vice Principal",
	staff: "Staff",
};

export function StaffFormDialog({
	open,
	onOpenChange,
	onSuccess,
	staff,
}: Props) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.staff.create.useMutation({
		onSuccess: () => {
			utils.staff.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
	});

	const update = trpc.staff.update.useMutation({
		onSuccess: () => {
			utils.staff.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: staff
			? {
					firstName: staff.firstName,
					lastName: staff.lastName,
					email: staff.email,
					phone: staff.phone ?? "",
					role: (staff.role as (typeof ROLES)[number] | undefined) ?? undefined,
				}
			: { role: "teacher" },
	});

	const onSubmit = handleSubmit(async (data) => {
		const payload = {
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone || undefined,
			role: data.role,
		};
		if (staff) {
			await update.mutateAsync({ id: staff.id, ...payload });
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
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{staff
							? t("staff.edit", "Edit staff member")
							: t("staff.add", "Add staff member")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("staff.first_name", "First name")}
							error={errors.firstName?.message}
							required
						>
							<Input {...register("firstName")} />
						</FormField>
						<FormField
							label={t("staff.last_name", "Last name")}
							error={errors.lastName?.message}
							required
						>
							<Input {...register("lastName")} />
						</FormField>
					</div>

					<FormField
						label={t("staff.email", "Email")}
						error={errors.email?.message}
						required
					>
						<Input type="email" {...register("email")} />
					</FormField>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("staff.phone", "Phone")}
							error={errors.phone?.message}
						>
							<Input {...register("phone")} />
						</FormField>
						<FormField
							label={t("staff.role", "Role")}
							error={errors.role?.message}
						>
							<Controller
								name="role"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value ?? ""}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t("common.select", "Select…")}
											/>
										</SelectTrigger>
										<SelectContent>
											{ROLES.map((r) => (
												<SelectItem key={r} value={r}>
													{ROLE_LABELS[r] ?? r}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
					</div>

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
							{staff
								? t("common.save", "Save")
								: t("staff.add", "Add staff member")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
