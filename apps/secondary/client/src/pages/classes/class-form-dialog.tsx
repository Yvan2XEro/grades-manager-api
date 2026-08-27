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
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(1).max(50),
	code: z.string().min(1).max(20),
	level: z.string().min(1).max(30),
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
}

export function ClassFormDialog({ open, onOpenChange, onSuccess }: Props) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
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
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {},
	});

	const onSubmit = handleSubmit(async (data) => {
		const capacityNum = data.maxCapacity
			? Number.parseInt(data.maxCapacity, 10)
			: undefined;
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
	});

	const handleOpenChange = (open: boolean) => {
		if (!open) reset();
		onOpenChange(open);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("classes.add", "Add class")}</DialogTitle>
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
						<Input {...register("level")} placeholder="e.g. 6ème" />
					</FormField>

					<FormField
						label={t("classes.academic_year", "Academic year")}
						error={errors.academicYearId?.message}
						required
					>
						<Select {...register("academicYearId")}>
							<SelectOption value="">
								— {t("common.select", "Select")} —
							</SelectOption>
							{years.map((y) => (
								<SelectOption key={y.id} value={y.id}>
									{y.name}
								</SelectOption>
							))}
						</Select>
					</FormField>

					<FormField
						label={t("classes.track", "Track")}
						error={errors.trackId?.message}
					>
						<Select {...register("trackId")}>
							<SelectOption value="">—</SelectOption>
							{tracks.map((tr) => (
								<SelectOption key={tr.id} value={tr.id}>
									{tr.name}
								</SelectOption>
							))}
						</Select>
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

					{create.error && (
						<p className="text-destructive text-sm">
							{create.error.message ?? t("common.error", "An error occurred")}
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
							{t("classes.add", "Add class")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
