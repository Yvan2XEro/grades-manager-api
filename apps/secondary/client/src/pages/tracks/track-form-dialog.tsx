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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(1).max(100),
	code: z.string().min(1).max(20),
	cycleLevel: z.enum(["first_cycle", "second_cycle", "technical"]),
	isOfficial: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function TrackFormDialog({ open, onOpenChange, onSuccess }: Props) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const create = trpc.tracks.create.useMutation({
		onSuccess: () => {
			utils.tracks.list.invalidate();
			onSuccess();
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { cycleLevel: "second_cycle", isOfficial: false },
	});

	const cycleLevel = watch("cycleLevel");

	const onSubmit = (values: FormValues) => {
		create.mutate(values);
	};

	const handleClose = () => {
		reset();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("tracks.create_title", "Create Track")}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
						<Button type="button" variant="outline" onClick={handleClose}>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={create.isPending}>
							{create.isPending
								? t("common.saving", "Saving…")
								: t("common.create", "Create")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
