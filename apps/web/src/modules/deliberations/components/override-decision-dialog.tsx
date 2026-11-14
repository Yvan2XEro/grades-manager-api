import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { trpcClient } from "@/utils/trpc";
import { useInvalidateDeliberation } from "../hooks/use-deliberation";
import {
	DELIBERATION_DECISIONS,
	type DeliberationDecision,
} from "../services/deliberation-status";

interface Props {
	deliberationId: string;
	studentResultId: string;
	studentName: string;
	currentDecision: string;
}

/** Overrides the final decision of one student result, with a reason. */
export const OverrideDecisionDialog = createCallable<Props, void>(
	({ call, deliberationId, studentResultId, studentName, currentDecision }) => {
		const { t } = useTranslation();
		const invalidateDeliberation = useInvalidateDeliberation(deliberationId);
		const [newDecision, setNewDecision] = useState("");
		const [reason, setReason] = useState("");

		const overrideMutation = useMutation({
			mutationFn: () =>
				trpcClient.deliberations.overrideDecision.mutate({
					deliberationId,
					studentResultId,
					finalDecision: newDecision as DeliberationDecision,
					reason,
				}),
			onSuccess: () => {
				toast.success(t("admin.deliberations.toast.overrideSuccess"));
				invalidateDeliberation();
				call.end();
			},
			onError: (err) => toast.error((err as Error).message),
		});

		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.deliberations.override.title")}</DialogTitle>
					</DialogHeader>

					<DialogBody className="space-y-4">
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
									{DELIBERATION_DECISIONS.filter(
										(d) => d !== currentDecision,
									).map((d) => (
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
								placeholder={t(
									"admin.deliberations.override.reasonPlaceholder",
								)}
								rows={3}
							/>
						</div>
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={() => call.end()}>
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
	},
	DIALOG_EXIT_MS,
);
