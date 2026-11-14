import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpcClient } from "@/utils/trpc";

const levelSchema = z.object({
	name: z.string().min(1),
	code: z.string().min(1),
	minCredits: z.coerce.number().int().min(0),
});

type LevelFormInput = z.input<typeof levelSchema>;
type LevelForm = z.output<typeof levelSchema>;

export type CycleLevelFormResult = RouterOutputs["studyCycles"]["createLevel"];

interface Props {
	cycleId: string;
	level?: { id: string; code: string; name: string; minCredits: number };
	/** Prefills a new level, e.g. the next `L<n>` code of the cycle. */
	defaults?: Partial<LevelForm>;
}

/** Creates or edits a cycle level; resolves with it, or `undefined`. */
export const CycleLevelFormDialog = createCallable<
	Props,
	CycleLevelFormResult | undefined
>(({ call, cycleId, level, defaults }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const form = useForm<LevelFormInput, unknown, LevelForm>({
		resolver: zodResolver(levelSchema),
		defaultValues: level
			? { code: level.code, name: level.name, minCredits: level.minCredits }
			: { code: "", name: "", minCredits: 60, ...defaults },
	});

	const submit = useMutationFlow(call, async (call, data: LevelForm) => {
		try {
			const saved = level
				? await trpcClient.studyCycles.updateLevel.mutate({
						...data,
						id: level.id,
					})
				: await trpcClient.studyCycles.createLevel.mutate({
						cycleId,
						...data,
					});
			toast.success(
				level
					? t("admin.studyCycles.toast.levelUpdate", {
							defaultValue: "Level updated",
						})
					: t("admin.studyCycles.toast.levelCreate", {
							defaultValue: "Level created",
						}),
			);
			queryClient.invalidateQueries({ queryKey: ["cycleLevels"] });
			queryClient.invalidateQueries({ queryKey: ["cycleLevelsByProgram"] });
			call.end(saved as CycleLevelFormResult);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-md"
			title={
				level
					? t("admin.studyCycles.actions.updateLevel", {
							defaultValue: "Update level",
						})
					: t("admin.studyCycles.actions.addLevel", {
							defaultValue: "Add level",
						})
			}
		>
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.studyCycles.form.name", {
											defaultValue: "Name",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Level 1" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.studyCycles.form.code", {
											defaultValue: "Code",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="L1" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="minCredits"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admin.studyCycles.form.minCredits", {
										defaultValue: "Minimum credits",
									})}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										{...field}
										value={field.value as number}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" disabled={submit.pending}>
						{t("common.actions.save")}
					</Button>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
