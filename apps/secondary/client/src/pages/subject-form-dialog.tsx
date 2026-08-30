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
import { trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(1).max(100),
	nameFr: z.string().max(100).optional(),
	code: z.string().min(1).max(30),
	minesecCode: z.string().max(30).optional(),
	subjectGroup: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof schema>;

interface SubjectData {
	id: string;
	name: string;
	nameFr?: string | null;
	code?: string | null;
	minesecCode?: string | null;
	subjectGroup?: string | null;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	subject?: SubjectData;
}

export function SubjectFormDialog({
	open,
	onOpenChange,
	onSuccess,
	subject,
}: Props) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.subjects.create.useMutation({
		onSuccess: () => {
			utils.subjects.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
	});

	const update = trpc.subjects.update.useMutation({
		onSuccess: () => {
			utils.subjects.list.invalidate();
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
		defaultValues: subject
			? {
					name: subject.name,
					nameFr: subject.nameFr ?? "",
					code: subject.code ?? "",
					minesecCode: subject.minesecCode ?? "",
					subjectGroup: subject.subjectGroup ?? "",
				}
			: {},
	});

	const onSubmit = handleSubmit(async (data) => {
		const payload = {
			name: data.name,
			nameFr: data.nameFr || undefined,
			code: data.code,
			minesecCode: data.minesecCode || undefined,
			subjectGroup: data.subjectGroup || undefined,
		};

		if (subject) {
			await update.mutateAsync({ id: subject.id, ...payload });
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
						{subject
							? t("subjects.edit", "Edit subject")
							: t("subjects.add", "Add subject")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("subjects.name", "Subject name (EN)")}
							error={errors.name?.message}
							required
						>
							<Input {...register("name")} />
						</FormField>
						<FormField
							label={t("subjects.name_fr", "Subject name (FR)")}
							error={errors.nameFr?.message}
						>
							<Input {...register("nameFr")} />
						</FormField>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							label={t("subjects.code", "Code")}
							error={errors.code?.message}
							required
						>
							<Input {...register("code")} />
						</FormField>
						<FormField
							label={t("subjects.minesec_code", "MINESEC code")}
							error={errors.minesecCode?.message}
						>
							<Input {...register("minesecCode")} />
						</FormField>
					</div>

					<FormField
						label={t("subjects.subject_group", "Subject group")}
						error={errors.subjectGroup?.message}
					>
						<Input {...register("subjectGroup")} />
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
							{subject
								? t("common.save", "Save")
								: t("subjects.add", "Add subject")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
