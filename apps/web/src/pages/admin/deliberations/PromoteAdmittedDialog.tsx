import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { AcademicYearSelect } from "../../../components/inputs/AcademicYearSelect";
import { ClassSelect } from "../../../components/inputs/ClassSelect";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { trpcClient } from "../../../utils/trpc";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deliberationId: string;
	admittedCount: number;
}

export default function PromoteAdmittedDialog({
	open,
	onOpenChange,
	deliberationId,
	admittedCount,
}: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [targetAcademicYearId, setTargetAcademicYearId] = useState<
		string | null
	>(null);
	const [targetClassId, setTargetClassId] = useState<string | null>(null);

	const promoteMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.promoteAdmitted.mutate({
				deliberationId,
				targetClassId: targetClassId!,
			}),
		onSuccess: (data) => {
			toast.success(
				t("admin.deliberations.promote.success", {
					count: data.promotedCount,
				}),
			);
			queryClient.invalidateQueries({
				queryKey: ["deliberation", deliberationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["deliberation-logs", deliberationId],
			});
			handleClose();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleClose() {
		setTargetAcademicYearId(null);
		setTargetClassId(null);
		onOpenChange(false);
	}

	const handleClassChange = useCallback(
		(value: string | null) => setTargetClassId(value),
		[],
	);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("admin.deliberations.promote.title")}</DialogTitle>
					<DialogDescription>
						{t("admin.deliberations.promote.description", {
							count: admittedCount,
						})}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{t("admin.deliberations.promote.targetAcademicYear")}</Label>
						<AcademicYearSelect
							value={targetAcademicYearId}
							onChange={setTargetAcademicYearId}
							autoSelectActive={false}
							placeholder={t(
								"admin.deliberations.promote.targetAcademicYearPlaceholder",
							)}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.promote.targetClass")}</Label>
						<ClassSelect
							academicYearId={targetAcademicYearId}
							value={targetClassId}
							onChange={handleClassChange}
							disabled={!targetAcademicYearId}
							placeholder={t(
								"admin.deliberations.promote.targetClassPlaceholder",
							)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => promoteMutation.mutate()}
						disabled={!targetClassId || promoteMutation.isPending}
					>
						{promoteMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{t("admin.deliberations.promote.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
