import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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
import {
	allowedClassLevels,
	CLASS_LEVELS,
	type InstitutionType,
	normalizeClassLevel,
} from "@/lib/academic-levels";
import { errorToast } from "@/lib/error-toast";
import { trpc } from "@/utils/trpc";

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

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
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

export function ClassFormDialog({
	open,
	onOpenChange,
	onSuccess,
	editClass,
}: Props) {
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
	const { data: tracksData } = trpc.tracks.list.useQuery({
		page: 1,
		pageSize: 100,
	});
	const tracks = tracksData?.items ?? [];

	const create = trpc.classes.create.useMutation({
		onSuccess: () => {
			utils.classes.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
		onError: (err) => errorToast(err, t),
	});

	const update = trpc.classes.update.useMutation({
		onSuccess: () => {
			utils.classes.list.invalidate();
			utils.classes.get.invalidate({ id: editClass?.id });
			onSuccess();
			onOpenChange(false);
		},
		onError: (err) => errorToast(err, t),
	});

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
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
			: {},
	});

	const onSubmit = handleSubmit(async (data) => {
		const capacityNum = data.maxCapacity
			? Number.parseInt(data.maxCapacity, 10)
			: undefined;
		if (isEditing && editClass) {
			await update.mutateAsync({
				id: editClass.id,
				name: data.name,
				code: data.code,
				level: data.level,
				trackId: data.trackId || null,
				room: data.room || null,
				maxCapacity:
					capacityNum && !Number.isNaN(capacityNum) ? capacityNum : null,
			});
		} else {
			await create.mutateAsync({
				name: data.name,
				code: data.code,
				level: data.level,
				academicYearId: data.academicYearId,
				trackId: data.trackId || undefined,
				room: data.room || undefined,
				maxCapacity:
					capacityNum && !Number.isNaN(capacityNum) ? capacityNum : undefined,
			});
		}
	});

	const handleOpenChange = (open: boolean) => {
		if (!open) reset();
		onOpenChange(open);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("classes.edit", "Edit class")
							: t("classes.add", "Add class")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
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
								<Combobox
									options={tracks.map((tr) => ({
										value: tr.id,
										label: tr.name,
									}))}
									value={field.value ?? ""}
									onValueChange={(val) => field.onChange(val || undefined)}
									placeholder={t("common.optional", "Optional…")}
									clearable
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
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isEditing
								? t("common.save", "Save")
								: t("classes.add", "Add class")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
