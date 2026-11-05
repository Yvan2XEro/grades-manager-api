import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { TimetableSessionDialog } from "@/pages/admin/timetable/TimetableSessionDialog";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

type TimetableSlot = RouterOutputs["timetable"]["list"][number];

/**
 * Opens an attendance session for a class course, attached to a timetable
 * slot (or flagged exceptional). A missing slot can be created in place.
 * Resolves with the created session, or `undefined` when dismissed.
 */
export const CreateAttendanceSessionDialog = createCallable<
	{ classCourseId: string; academicYearId?: string | null },
	RouterOutputs["attendance"]["createSession"] | undefined
>(({ call, classCourseId, academicYearId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [sessionDate, setSessionDate] = useState(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [courseSessionId, setCourseSessionId] = useState<string | null>(null);
	const [isExceptional, setIsExceptional] = useState(false);

	const slotsQuery = useQuery(
		trpc.timetable.list.queryOptions({ classCourseId }),
	);
	const slots = (slotsQuery.data ?? []) as TimetableSlot[];

	const createSlot = async () => {
		const result = await TimetableSessionDialog.call({
			classCourseId,
			academicYearId: academicYearId ?? undefined,
		});
		if (result !== "saved") return;
		// The create result isn't returned by the dialog: refetch and pick the newest slot
		const fresh = (await queryClient.fetchQuery(
			trpc.timetable.list.queryOptions({ classCourseId }),
		)) as TimetableSlot[];
		const known = new Set(slots.map((s) => s.id));
		const created = fresh.find((s) => !known.has(s.id));
		if (created) setCourseSessionId(created.id);
	};

	const create = useMutationFlow(call, async (call) => {
		try {
			const session = await trpcClient.attendance.createSession.mutate({
				classCourseId,
				sessionDate,
				courseSessionId: isExceptional
					? undefined
					: (courseSessionId ?? undefined),
				isExceptional: isExceptional || undefined,
			});
			toast.success(t("teacher.attendanceManagement.toast.sessionCreated"));
			queryClient.invalidateQueries(
				trpc.attendance.listSessions.queryFilter({}),
			);
			call.end(session);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={create.pending}
			className="sm:max-w-sm"
			title={t("teacher.attendanceManagement.newSession")}
		>
			<div className="space-y-4">
				<div>
					<Label>{t("teacher.attendanceManagement.createSession")}</Label>
					<Input
						type="date"
						className="mt-1"
						value={sessionDate}
						onChange={(e) => setSessionDate(e.target.value)}
					/>
				</div>
				{!isExceptional && (
					<div>
						<Label className="mb-1 block">
							{t("teacher.attendanceManagement.timetableSlot", {
								defaultValue: "Timetable slot",
							})}
						</Label>
						<QuickCreate
							onCreate={createSlot}
							label={t("teacher.timetable.newSession")}
						>
							<Select
								value={courseSessionId ?? ""}
								onValueChange={(v) => setCourseSessionId(v || null)}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"teacher.attendanceManagement.timetableSlotPlaceholder",
											{
												defaultValue: "Select a timetable slot",
											},
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{slots.length === 0 ? (
										<div className="px-3 py-2 text-muted-foreground text-sm">
											{t("teacher.attendanceManagement.noSlots", {
												defaultValue: "No timetable slot for this course",
											})}
										</div>
									) : (
										slots.map((slot) => (
											<SelectItem key={slot.id} value={slot.id}>
												{t(`teacher.timetable.days.${slot.dayOfWeek}`, {
													defaultValue: slot.dayOfWeek,
												})}{" "}
												{slot.startTime}–{slot.endTime}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</QuickCreate>
					</div>
				)}
				<div className="flex items-center gap-2">
					<Checkbox
						id="isExceptional"
						checked={isExceptional}
						onCheckedChange={(checked) => {
							setIsExceptional(!!checked);
							if (checked) setCourseSessionId(null);
						}}
					/>
					<label htmlFor="isExceptional" className="cursor-pointer text-sm">
						{t("teacher.attendanceManagement.isExceptional", {
							defaultValue: "Exceptional session (outside the timetable)",
						})}
					</label>
				</div>
			</div>
			<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					disabled={create.pending}
					onClick={() => call.end(undefined)}
				>
					{t("common.cancel")}
				</Button>
				<Button
					onClick={() => create()}
					disabled={
						!sessionDate ||
						(!isExceptional && !courseSessionId) ||
						create.pending
					}
				>
					{t("common.create")}
				</Button>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

/**
 * Excuses an absence with a reason, an optional category and justification
 * document (per the institution policy); resolves `true` once excused.
 */
export const ExcuseAbsenceDialog = createCallable<
	{
		recordId: string;
		studentName: string;
		acceptedCategories: string[];
		requiresDocument: boolean;
		onExcused: () => void;
	},
	boolean
>(
	({
		call,
		recordId,
		studentName,
		acceptedCategories,
		requiresDocument,
		onExcused,
	}) => {
		const { t } = useTranslation();
		const [excuseReason, setExcuseReason] = useState("");
		const [excuseCategory, setExcuseCategory] = useState("");
		const [justificationDocumentUrl, setJustificationDocumentUrl] =
			useState("");

		const uploadJustification = useMutation({
			mutationFn: async (file: File) => {
				const base64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => {
						const result = String(reader.result ?? "");
						resolve(result.includes(",") ? result.split(",")[1] : result);
					};
					reader.onerror = () => reject(reader.error);
					reader.readAsDataURL(file);
				});
				return trpcClient.files.uploadAttendanceJustification.mutate({
					filename: file.name,
					mimeType: file.type || "application/octet-stream",
					base64,
				});
			},
			onSuccess: (stored) => {
				setJustificationDocumentUrl(stored.url);
				toast.success(t("teacher.attendanceManagement.toast.documentUploaded"));
			},
			onError: (err) => toast.error(err.message),
		});

		const excuse = useMutationFlow(call, async (call) => {
			try {
				await trpcClient.attendance.excuseAbsence.mutate({
					attendanceRecordId: recordId,
					excuseReason,
					excuseCategory: excuseCategory || undefined,
					justificationDocumentUrl: justificationDocumentUrl || undefined,
					approve: true,
				});
				toast.success(t("teacher.attendanceManagement.toast.excused"));
				onExcused();
				call.end(true);
			} catch (err) {
				toast.error((err as Error).message);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={excuse.pending}
				className="sm:max-w-sm"
				title={t("teacher.attendanceManagement.excuse")}
			>
				<div className="space-y-3">
					<p className="text-muted-foreground text-sm">
						{t("teacher.attendanceManagement.student")}:{" "}
						<span className="font-medium text-foreground">{studentName}</span>
					</p>
					{acceptedCategories.length > 0 && (
						<div>
							<Label>{t("teacher.attendanceManagement.excuseCategory")}</Label>
							<Select value={excuseCategory} onValueChange={setExcuseCategory}>
								<SelectTrigger className="mt-1">
									<SelectValue
										placeholder={t(
											"teacher.attendanceManagement.excuseCategoryPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{acceptedCategories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<div>
						<Label>{t("teacher.attendanceManagement.excuseReason")}</Label>
						<Textarea
							className="mt-1"
							placeholder={t("teacher.attendanceManagement.excusePlaceholder")}
							value={excuseReason}
							onChange={(e) => setExcuseReason(e.target.value)}
							rows={3}
						/>
					</div>
					<div className="space-y-2">
						<Label>
							{t("teacher.attendanceManagement.justificationDocument")}
							{requiresDocument ? " *" : ""}
						</Label>
						<Input
							type="file"
							onChange={(event) => {
								const file = event.target.files?.[0];
								if (file) uploadJustification.mutate(file);
							}}
						/>
						<Input
							value={justificationDocumentUrl}
							onChange={(event) =>
								setJustificationDocumentUrl(event.target.value)
							}
							placeholder={t(
								"teacher.attendanceManagement.justificationDocumentPlaceholder",
							)}
						/>
						{uploadJustification.isPending && (
							<p className="text-muted-foreground text-xs">
								{t("teacher.attendanceManagement.uploadingDocument")}
							</p>
						)}
					</div>
				</div>
				<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						disabled={excuse.pending}
						onClick={() => call.end(false)}
					>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={() => excuse()}
						disabled={
							!excuseReason.trim() ||
							(acceptedCategories.length > 0 && !excuseCategory) ||
							(requiresDocument && !justificationDocumentUrl.trim()) ||
							excuse.pending ||
							uploadJustification.isPending
						}
					>
						{t("teacher.attendanceManagement.submitExcuse")}
					</Button>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
