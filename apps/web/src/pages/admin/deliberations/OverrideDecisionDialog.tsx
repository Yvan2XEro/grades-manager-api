import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { trpcClient } from "../../../utils/trpc";

const DECISIONS = [
	"admitted",
	"compensated",
	"deferred",
	"repeat",
	"excluded",
] as const;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deliberationId: string;
	studentResultId: string;
	studentName: string;
	currentDecision: string;
}

export default function OverrideDecisionDialog({
	open,
	onOpenChange,
	deliberationId,
	studentResultId,
	studentName,
	currentDecision,
}: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [newDecision, setNewDecision] = useState("");
	const [reason, setReason] = useState("");

	const overrideMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.overrideDecision.mutate({
				deliberationId,
				studentResultId,
				finalDecision: newDecision as (typeof DECISIONS)[number],
				reason,
			}),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.overrideSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["deliberation", deliberationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["deliberation-logs", deliberationId],
			});
			onOpenChange(false);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("admin.deliberations.override.title")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<p className="font-medium text-sm">{studentName}</p>

					<div className="space-y-1">
						<Label>{t("admin.deliberations.override.currentDecision")}</Label>
						<div>
							<Badge variant="outline">
								{t(`admin.deliberations.decision.${currentDecision}`, {
									defaultValue: currentDecision,
								})}
							</Badge>
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.override.newDecision")}</Label>
						<Select value={newDecision} onValueChange={setNewDecision}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{DECISIONS.filter((d) => d !== currentDecision).map((d) => (
									<SelectItem key={d} value={d}>
										{t(`admin.deliberations.decision.${d}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.deliberations.override.reason")}</Label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t("admin.deliberations.override.reasonPlaceholder")}
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => overrideMutation.mutate()}
						disabled={
							!newDecision || !reason.trim() || overrideMutation.isPending
						}
					>
						{overrideMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{t("common.actions.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
