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
import { Combobox } from "@/components/ui/combobox";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	allowedClassLevels,
	CLASS_LEVELS,
	type InstitutionType,
	normalizeClassLevel,
} from "@/lib/academic-levels";
import { errorToast } from "@/lib/error-toast";
import { upsertInList } from "@/lib/query-cache";
import { TrackFormDialog } from "@/pages/tracks/track-form-dialog";
import { type RouterOutputs, trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(1).max(50),
	code: z.string().min(1).max(20),
	level: z.enum(CLASS_LEVELS),
	academicYearId: z.string().uuid(),
	trackId: z.string().uuid().optional(),
	room: z.string().max(50).optional(),
	maxCapacity: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export type ClassFormResult = RouterOutputs["classes"]["create"];

const TRACKS_INPUT = { page: 1, pageSize: 100 };

interface Props {
	/** Prefills (and is overridden by) the edited class; e.g. the active year. */
	defaults?: Partial<FormValues>;
	/** Prevents changing the year, e.g. when the caller lists one year's classes. */
	lockAcademicYear?: boolean;
	editClass?: {
		id: string;
		name: string;
		code: string;
		level: string;
		academicYearId: string;
		trackId?: string | null;
		room?: string | null;
		maxCapacity?: number | null;
	};
}

/** Resolves with the saved class, or `undefined` when dismissed. */
export const ClassFormDialog = createCallable<
	Props,
	ClassFormResult | undefined
>(({ call, defaults, lockAcademicYear, editClass }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const isEditing = !!editClass;

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const { data: institution } = trpc.institutions.get.useQuery();
	const currentLevel = editClass
		? normalizeClassLevel(editClass.level)
		: undefined;
	const allowedLevels = allowedClassLevels(
		institution?.type as InstitutionType,
	);
	const levelOptions =
		currentLevel && !allowedLevels.includes(currentLevel)
			? [...allowedLevels, currentLevel]
			: allowedLevels;
	const { data: tracksData } = trpc.tracks.list.useQuery(TRACKS_INPUT);
	const tracks = tracksData?.items ?? [];

	const create = trpc.classes.create.useMutation({
		onSuccess: () => utils.classes.list.invalidate(),
	});

	const update = trpc.classes.update.useMutation({
		onSuccess: () => {
			utils.classes.list.invalidate();
			utils.classes.get.invalidate({ id: editClass?.id });
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: editClass
			? {
					name: editClass.name,
					code: editClass.code,
					level: normalizeClassLevel(editClass.level),
					academicYearId: editClass.academicYearId,
					trackId: editClass.trackId ?? undefined,
					room: editClass.room ?? undefined,
					maxCapacity: editClass.maxCapacity?.toString() ?? undefined,
				}
			: { ...defaults },
	});

	const createTrack = async () => {
		const track = await TrackFormDialog.call({});
		if (!track) return;
		utils.tracks.list.setData(TRACKS_INPUT, (old) => upsertInList(old, track));
		return { value: track.id, label: track.name };
	};

	const submit = useMutationFlow(call, async (call, data: FormValues) => {
		const capacityNum = data.maxCapacity
			? Number.parseInt(data.maxCapacity, 10)
			: undefined;
		const maxCapacity =
			capacityNum && !Number.isNaN(capacityNum) ? capacityNum : undefined;
		try {
			call.end(
				isEditing && editClass
					? await update.mutateAsync({
							id: editClass.id,
							name: data.name,
							code: data.code,
							level: data.level,
							trackId: data.trackId || null,
							room: data.room || null,
							maxCapacity: maxCapacity ?? null,
						})
					: await create.mutateAsync({
							name: data.name,
							code: data.code,
							level: data.level,
							academicYearId: data.academicYearId,
							trackId: data.trackId || undefined,
							room: data.room || undefined,
							maxCapacity,
						}),
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
				isEditing
					? t("classes.edit", "Edit class")
					: t("classes.add", "Add class")
			}
		>
			<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-3">
					<FormField
						label={t("classes.col_name", "Name")}
						error={errors.name?.message}
						required
					>
						<Input {...register("name")} placeholder="e.g. 6ème A" />
					</FormField>
					<FormField
						label={t("classes.col_code", "Code")}
						error={errors.code?.message}
						required
					>
						<Input {...register("code")} placeholder="e.g. 6A" />
					</FormField>
				</div>

				<FormField
					label={t("classes.col_level", "Level")}
					error={errors.level?.message}
					required
				>
					<Controller
						name="level"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{levelOptions.map((level) => (
										<SelectItem key={level} value={level}>
											{t(`classes.level_${level}`, level)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</FormField>

				<FormField
					label={t("classes.academic_year", "Academic year")}
					error={errors.academicYearId?.message}
					required
				>
					<Controller
						name="academicYearId"
						control={control}
						render={({ field }) => (
							<Combobox
								options={years.map((y) => ({ value: y.id, label: y.name }))}
								value={field.value ?? ""}
								onValueChange={field.onChange}
								placeholder={t("common.select", "Select…")}
								disabled={lockAcademicYear || isEditing}
							/>
						)}
					/>
				</FormField>

				<FormField
					label={t("classes.track", "Track")}
					error={errors.trackId?.message}
				>
					<Controller
						name="trackId"
						control={control}
						render={({ field }) => (
							<CreatableCombobox
								options={tracks.map((tr) => ({
									value: tr.id,
									label: tr.name,
								}))}
								value={field.value ?? ""}
								onValueChange={(val) => field.onChange(val || undefined)}
								placeholder={t("common.optional", "Optional…")}
								clearable
								onCreate={createTrack}
								createLabel={t("tracks.create_btn", "New Track")}
							/>
						)}
					/>
				</FormField>

				<div className="grid grid-cols-2 gap-3">
					<FormField
						label={t("classes.room", "Room")}
						error={errors.room?.message}
					>
						<Input {...register("room")} />
					</FormField>
					<FormField
						label={t("classes.max_capacity", "Max capacity")}
						error={errors.maxCapacity?.message}
					>
						<Input type="number" min={1} {...register("maxCapacity")} />
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
						{isEditing
							? t("common.save", "Save")
							: t("classes.add", "Add class")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
