import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import { RoomFormDialog } from "./RoomFormDialog";

type Session = RouterOutputs["timetable"]["list"][number];
type Room = RouterOutputs["rooms"]["list"][number];

const NO_ROOM_SENTINEL = "__none__";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const sessionSchema = z
	.object({
		dayOfWeek: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
		startTime: z.string().regex(timeRe, "HH:MM required"),
		endTime: z.string().regex(timeRe, "HH:MM required"),
		roomId: z.string(),
		validFrom: z.string(),
		validUntil: z.string(),
	})
	.refine((d) => d.startTime < d.endTime, {
		message: "End time must be after start time",
		path: ["endTime"],
	})
	.refine((d) => !d.validFrom || !d.validUntil || d.validFrom <= d.validUntil, {
		message: "Valid until must be after valid from",
		path: ["validUntil"],
	});
export type SessionForm = z.infer<typeof sessionSchema>;

const DEFAULT_SESSION: SessionForm = {
	dayOfWeek: "mon",
	startTime: "08:00",
	endTime: "10:00",
	roomId: NO_ROOM_SENTINEL,
	validFrom: "",
	validUntil: "",
};

interface Props {
	/** Edits this session; otherwise creates one for the given class course. */
	session?: Session;
	classCourseId?: string;
	academicYearId?: string;
}

/**
 * Creates or edits a timetable session. A missing room can be created in place
 * from the "+" next to the room select. Resolves with "saved", "delete" when
 * the user asks to delete the edited session, or `undefined` when dismissed.
 */
export const TimetableSessionDialog = createCallable<
	Props,
	"saved" | "delete" | undefined
>(({ call, session, classCourseId, academicYearId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const DAYS = [
		{ value: "mon", label: t("teacher.timetable.days.mon") },
		{ value: "tue", label: t("teacher.timetable.days.tue") },
		{ value: "wed", label: t("teacher.timetable.days.wed") },
		{ value: "thu", label: t("teacher.timetable.days.thu") },
		{ value: "fri", label: t("teacher.timetable.days.fri") },
		{ value: "sat", label: t("teacher.timetable.days.sat") },
	];

	const sessionForm = useForm<SessionForm>({
		resolver: zodResolver(sessionSchema),
		defaultValues: session
			? {
					dayOfWeek: session.dayOfWeek as SessionForm["dayOfWeek"],
					startTime: session.startTime,
					endTime: session.endTime,
					roomId: session.roomId ?? NO_ROOM_SENTINEL,
					validFrom: session.validFrom ?? "",
					validUntil: session.validUntil ?? "",
				}
			: DEFAULT_SESSION,
	});

	const roomsQuery = useQuery(trpc.rooms.list.queryOptions({}));
	const activeRooms = ((roomsQuery.data ?? []) as Room[]).filter(
		(r) => r.isActive,
	);

	const createRoom = async () => {
		const room = await RoomFormDialog.call({});
		if (!room) return;
		queryClient.setQueryData<Room[]>(
			trpc.rooms.list.queryKey({}) as readonly unknown[],
			(old) => upsertInList(old, room as Room),
		);
		sessionForm.setValue("roomId", room.id, { shouldValidate: true });
	};

	const toastCapacityWarning = (
		w: { roomCapacity: number; classSize: number } | null | undefined,
	) => {
		if (!w) return;
		toast.warning(
			t("teacher.timetable.capacityWarning", {
				classSize: w.classSize,
				roomCapacity: w.roomCapacity,
			}),
		);
	};

	const submit = useMutationFlow(call, async (call, values: SessionForm) => {
		try {
			if (session) {
				const res = await trpcClient.timetable.update.mutate({
					id: session.id,
					...values,
					roomId: values.roomId === NO_ROOM_SENTINEL ? null : values.roomId,
					validFrom: values.validFrom || null,
					validUntil: values.validUntil || null,
				});
				toast.success(t("teacher.timetable.toast.updated"));
				toastCapacityWarning(res.capacityWarning);
			} else {
				if (!classCourseId || !academicYearId) return;
				const res = await trpcClient.timetable.create.mutate({
					...values,
					classCourseId,
					academicYearId,
					roomId:
						values.roomId === NO_ROOM_SENTINEL ? undefined : values.roomId,
					validFrom: values.validFrom || undefined,
					validUntil: values.validUntil || undefined,
				});
				toast.success(t("teacher.timetable.toast.created"));
				toastCapacityWarning(res.capacityWarning);
			}
			queryClient.invalidateQueries(trpc.timetable.list.queryFilter({}));
			call.end("saved");
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
				session
					? t("teacher.timetable.editSession")
					: t("teacher.timetable.newSession")
			}
		>
			<form onSubmit={sessionForm.handleSubmit(submit)}>
				<div className="space-y-4">
					<div>
						<label className="mb-1 block font-medium text-sm">
							{t("teacher.timetable.day")}
						</label>
						<Controller
							control={sessionForm.control}
							name="dayOfWeek"
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{DAYS.map((d) => (
											<SelectItem key={d.value} value={d.value}>
												{d.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block font-medium text-sm">
								{t("teacher.timetable.startTime")}
							</label>
							<Input type="time" {...sessionForm.register("startTime")} />
						</div>
						<div>
							<label className="mb-1 block font-medium text-sm">
								{t("teacher.timetable.endTime")}
							</label>
							<Input type="time" {...sessionForm.register("endTime")} />
							{sessionForm.formState.errors.endTime && (
								<p className="mt-1 text-destructive text-xs">
									{sessionForm.formState.errors.endTime.message}
								</p>
							)}
						</div>
					</div>
					<div>
						<label className="mb-1 block font-medium text-sm">
							{t("teacher.timetable.room")}
						</label>
						<Controller
							control={sessionForm.control}
							name="roomId"
							render={({ field }) => (
								<QuickCreate
									onCreate={createRoom}
									label={t("teacher.rooms.add")}
								>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue
												placeholder={t("teacher.timetable.noRoom")}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={NO_ROOM_SENTINEL}>
												{t("teacher.timetable.noRoom")}
											</SelectItem>
											{activeRooms.map((r) => (
												<SelectItem key={r.id} value={r.id}>
													{r.name}
													{r.capacity && (
														<span className="ml-1 text-muted-foreground text-xs">
															({r.capacity} {t("teacher.rooms.seats")})
														</span>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</QuickCreate>
							)}
						/>
						{sessionForm.watch("roomId") === NO_ROOM_SENTINEL && (
							<p className="mt-1.5 flex items-center gap-1.5 text-amber-600 text-xs dark:text-amber-400">
								<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
								{t("teacher.timetable.warnings.noRoomSelected")}
							</p>
						)}
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block font-medium text-sm">
								{t("teacher.timetable.validFrom")}
							</label>
							<Input type="date" {...sessionForm.register("validFrom")} />
						</div>
						<div>
							<label className="mb-1 block font-medium text-sm">
								{t("teacher.timetable.validUntil")}
							</label>
							<Input type="date" {...sessionForm.register("validUntil")} />
							{sessionForm.formState.errors.validUntil && (
								<p className="mt-1 text-destructive text-xs">
									{sessionForm.formState.errors.validUntil.message}
								</p>
							)}
						</div>
					</div>
				</div>
				<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
					{session && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="mr-auto text-destructive/80 hover:text-destructive"
							disabled={submit.pending}
							onClick={() => call.end("delete")}
						>
							<Trash2 className="mr-1.5 h-3.5 w-3.5" />
							{t("teacher.timetable.delete")}
						</Button>
					)}
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("teacher.timetable.cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{session
							? t("teacher.timetable.save")
							: t("teacher.timetable.create")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
