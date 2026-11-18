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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { errorToast } from "@/lib/error-toast";
import { type RouterOutputs, trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(1).max(100),
	code: z.string().min(1).max(20),
	cycleLevel: z.enum(["first_cycle", "second_cycle", "technical"]),
	isOfficial: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export type TrackFormResult = RouterOutputs["tracks"]["create"];

interface Props {
	editTrack?: {
		id: string;
		name: string;
		code: string;
		cycleLevel: "first_cycle" | "second_cycle" | "technical";
		isOfficial?: boolean;
	};
	defaults?: Partial<FormValues>;
}

/** Resolves with the saved track, or `undefined` when dismissed. */
export const TrackFormDialog = createCallable<
	Props,
	TrackFormResult | undefined
>(({ call, editTrack, defaults }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const isEditing = !!editTrack;

	const create = trpc.tracks.create.useMutation({
		onSuccess: () => utils.tracks.list.invalidate(),
	});

	const update = trpc.tracks.update.useMutation({
		onSuccess: () => {
			utils.tracks.list.invalidate();
			utils.tracks.get.invalidate({ id: editTrack?.id });
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: editTrack ?? {
			cycleLevel: "second_cycle",
			isOfficial: false,
			...defaults,
		},
	});

	const cycleLevel = watch("cycleLevel");

	const submit = useMutationFlow(call, async (call, values: FormValues) => {
		try {
			call.end(
				isEditing && editTrack
					? await update.mutateAsync({ id: editTrack.id, ...values })
					: await create.mutateAsync(values),
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
			title={
				isEditing
					? t("tracks.edit", "Edit track")
					: t("tracks.create_title", "Create Track")
			}
		>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField
					label={t("tracks.field_name", "Track name")}
					error={errors.name?.message}
				>
					<Input {...register("name")} placeholder="Terminale C" />
				</FormField>

				<FormField
					label={t("tracks.field_code", "Code")}
					error={errors.code?.message}
				>
					<Input {...register("code")} placeholder="TLE-C" />
				</FormField>

				<FormField
					label={t("tracks.field_cycle", "Cycle level")}
					error={errors.cycleLevel?.message}
				>
					<Select
						value={cycleLevel}
						onValueChange={(val) =>
							setValue("cycleLevel", val as FormValues["cycleLevel"])
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="first_cycle">
								{t("tracks.cycle_first", "First cycle (6e–3e)")}
							</SelectItem>
							<SelectItem value="second_cycle">
								{t("tracks.cycle_second", "Second cycle (2nde–Tle)")}
							</SelectItem>
							<SelectItem value="technical">
								{t("tracks.cycle_technical", "Technical")}
							</SelectItem>
						</SelectContent>
					</Select>
				</FormField>

				<div className="flex justify-end gap-3 pt-2">
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
							: isEditing
								? t("common.save", "Save")
								: t("common.create", "Create")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
