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
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

type Room = RouterOutputs["rooms"]["list"][number];

const roomSchema = z.object({
	code: z.string().min(1, "Required").max(20),
	name: z.string().min(1, "Required"),
	capacity: z.preprocess(
		(v) => (v === "" || v === undefined ? undefined : Number(v)),
		z.number().int().positive().optional(),
	),
	building: z.string().optional(),
	campus: z.string().optional(),
});
type RoomFormInput = z.input<typeof roomSchema>;
type RoomForm = z.output<typeof roomSchema>;

export type RoomFormResult = RouterOutputs["rooms"]["create"];

/** Creates or edits a room; resolves with the saved room, or `undefined`. */
export const RoomFormDialog = createCallable<
	{ room?: Room },
	RoomFormResult | undefined
>(({ call, room }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const form = useForm<RoomFormInput, unknown, RoomForm>({
		resolver: zodResolver(roomSchema),
		defaultValues: room
			? {
					code: room.code,
					name: room.name,
					capacity: room.capacity ?? undefined,
					building: room.building ?? "",
					campus: room.campus ?? "",
				}
			: { code: "", name: "", capacity: undefined, building: "", campus: "" },
	});

	const submit = useMutationFlow(call, async (call, values: RoomForm) => {
		try {
			const saved = room
				? await trpcClient.rooms.update.mutate({
						id: room.id,
						code: values.code,
						name: values.name,
						capacity: values.capacity ?? null,
						building: values.building || null,
						campus: values.campus || null,
					})
				: await trpcClient.rooms.create.mutate({
						code: values.code,
						name: values.name,
						capacity: values.capacity,
						building: values.building || undefined,
						campus: values.campus || undefined,
					});
			toast.success(t("common.saved"));
			queryClient.invalidateQueries(trpc.rooms.list.queryFilter());
			call.end(saved as RoomFormResult);
		} catch (e) {
			toast.error((e as Error).message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-lg"
			title={room ? t("teacher.rooms.edit") : t("teacher.rooms.add")}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)}>
					<div className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("teacher.rooms.fields.code")} *</FormLabel>
										<FormControl>
											<Input
												{...field}
												maxLength={20}
												placeholder="AMP-A"
												onChange={(e) =>
													field.onChange(e.target.value.toUpperCase())
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="capacity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("teacher.rooms.fields.capacity")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												placeholder="120"
												value={(field.value as number | undefined) ?? ""}
												onChange={(e) => field.onChange(e.target.value)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("teacher.rooms.fields.name")} *</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t("teacher.rooms.placeholders.roomName")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="building"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("teacher.rooms.fields.building")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t("teacher.rooms.placeholders.building")}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="campus"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("teacher.rooms.fields.campus")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t("teacher.rooms.placeholders.campus")}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
					<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(undefined)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{t("common.save")}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
