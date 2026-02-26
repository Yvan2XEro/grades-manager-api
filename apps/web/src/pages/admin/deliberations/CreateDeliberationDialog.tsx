import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AcademicYearSelect } from "../../../components/inputs/AcademicYearSelect";
import { ClassSelect } from "../../../components/inputs/ClassSelect";
import { SemesterSelect } from "../../../components/inputs/SemesterSelect";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { trpcClient } from "../../../utils/trpc";

const TYPES = ["semester", "annual", "retake"] as const;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function CreateDeliberationDialog({
	open,
	onOpenChange,
}: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [type, setType] = useState<string>("");
	const [deliberationDate, setDeliberationDate] = useState("");

	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.create.mutate({
				classId: classId!,
				academicYearId: academicYearId!,
				type: type as (typeof TYPES)[number],
				semesterId: semesterId || undefined,
				deliberationDate: deliberationDate
					? new Date(deliberationDate).toISOString()
					: undefined,
			}),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["deliberations"] });
			handleClose();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleClose() {
		setAcademicYearId(null);
		setClassId(null);
		setSemesterId(null);
		setType("");
		setDeliberationDate("");
		onOpenChange(false);
	}

	const canSubmit = !!classId && !!academicYearId && !!type;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("admin.deliberations.form.createTitle")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{t("admin.deliberations.form.academicYear")}</Label>
						<AcademicYearSelect
							value={academicYearId}
							onChange={setAcademicYearId}
							autoSelectActive
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.form.class")}</Label>
						<ClassSelect
							academicYearId={academicYearId}
							value={classId}
							onChange={setClassId}
							placeholder={t("admin.deliberations.form.classPlaceholder")}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.form.type")}</Label>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger>
								<SelectValue
									placeholder={t("admin.deliberations.form.typePlaceholder")}
								/>
							</SelectTrigger>
							<SelectContent>
								{TYPES.map((ty) => (
									<SelectItem key={ty} value={ty}>
										{t(`admin.deliberations.type.${ty}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{type === "semester" && (
						<div className="space-y-2">
							<Label>{t("admin.deliberations.form.semester")}</Label>
							<SemesterSelect
								value={semesterId}
								onChange={setSemesterId}
								placeholder={t("admin.deliberations.form.semesterPlaceholder")}
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label>{t("admin.deliberations.form.deliberationDate")}</Label>
						<Input
							type="date"
							value={deliberationDate}
							onChange={(e) => setDeliberationDate(e.target.value)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => createMutation.mutate()}
						disabled={!canSubmit || createMutation.isPending}
					>
						{createMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{t("common.actions.create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
