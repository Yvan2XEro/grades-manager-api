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
import { type RouterOutputs, trpc } from "@/utils/trpc";

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

export type StaffFormResult = RouterOutputs["staff"]["create"];

interface Props {
	staff?: StaffMember;
	/** Preselected role when creating, e.g. "teacher" from an assignment form. */
	defaultRole?: (typeof ROLES)[number];
}

const ROLE_LABELS: Record<string, string> = {
	teacher: "Teacher",
	admin: "Administrator",
	principal: "Principal",
	vice_principal: "Vice Principal",
	staff: "Staff",
};

/** Resolves with the saved staff member, or `undefined` when dismissed. */
export const StaffFormDialog = createCallable<
	Props,
	StaffFormResult | undefined
>(({ call, staff, defaultRole = "teacher" }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.staff.create.useMutation({
		onSuccess: () => utils.staff.list.invalidate(),
	});

	const update = trpc.staff.update.useMutation({
		onSuccess: () => utils.staff.list.invalidate(),
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
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
			: { role: defaultRole },
	});

	const submit = useMutationFlow(call, async (call, data: FormValues) => {
		const payload = {
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone || undefined,
			role: data.role,
		};
		try {
			call.end(
				staff
					? await update.mutateAsync({ id: staff.id, ...payload })
					: await create.mutateAsync(payload),
			);
		} catch (err) {
			errorToast(err, t);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="max-w-lg"
			title={
				staff
					? t("staff.edit", "Edit staff member")
					: t("staff.add", "Add staff member")
			}
		>
			<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
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
					required={!staff}
					hint={
						staff
							? t(
									"staff.email_readonly_hint",
									"Email cannot be changed — managed by the staff member",
								)
							: undefined
					}
				>
					<Input
						type="email"
						{...register("email")}
						readOnly={!!staff}
						className={
							staff
								? "cursor-default bg-muted text-muted-foreground"
								: undefined
						}
					/>
				</FormField>

				<div className="grid grid-cols-2 gap-3">
					<FormField
						label={t("staff.phone", "Phone")}
						error={errors.phone?.message}
					>
						<Controller
							name="phone"
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
										<SelectValue placeholder={t("common.select", "Select…")} />
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
							? t("common.saving", "Saving…")
							: t("common.save", "Save")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
