import { zodResolver } from "@hookform/resolvers/zod";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { errorToast } from "@/lib/error-toast";
import { type RouterOutputs, trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(1).max(100),
	nameFr: z.string().min(1).max(100),
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

export type SubjectFormResult = RouterOutputs["subjects"]["create"];

interface Props {
	subject?: SubjectData;
}

/** Resolves with the saved subject, or `undefined` when dismissed. */
export const SubjectFormDialog = createCallable<
	Props,
	SubjectFormResult | undefined
>(({ call, subject }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.subjects.create.useMutation({
		onSuccess: () => utils.subjects.list.invalidate(),
	});

	const update = trpc.subjects.update.useMutation({
		onSuccess: () => utils.subjects.list.invalidate(),
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
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

	const submit = useMutationFlow(call, async (call, data: FormValues) => {
		const payload = {
			name: data.name,
			nameFr: data.nameFr,
			code: data.code,
			minesecCode: data.minesecCode || undefined,
			subjectGroup: data.subjectGroup || undefined,
		};
		try {
			call.end(
				subject
					? await update.mutateAsync({ id: subject.id, ...payload })
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
				subject
					? t("subjects.edit", "Edit subject")
					: t("subjects.add", "Add subject")
			}
		>
			<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
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
						required
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
						{subject
							? t("common.save", "Save")
							: t("subjects.add", "Add subject")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
