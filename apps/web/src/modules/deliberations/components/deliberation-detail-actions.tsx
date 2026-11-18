import {
	Download,
	FileSignature,
	FileSpreadsheet,
	Gavel,
	Loader2,
	Lock,
	Play,
	UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { useDeliberationActions } from "../hooks/use-deliberation";
import type { DeliberationAction } from "../types";

interface DeliberationDetailActionsProps {
	deliberationId: string;
	status: string;
	onPromoteAdmitted: () => void;
}

/** Header buttons of a deliberation, depending on its workflow status. */
export function DeliberationDetailActions({
	deliberationId,
	status,
	onPromoteAdmitted,
}: DeliberationDetailActionsProps) {
	const { t } = useTranslation();
	const { transition, compute, pdfExport, excelExport } =
		useDeliberationActions(deliberationId);

	const confirmTransition = (
		action: Exclude<DeliberationAction, "open">,
		texts: { title: string; message: string; confirmText: string },
	) => confirmAction({ ...texts, onConfirm: () => transition.mutate(action) });

	const promoteButton = (
		<Button variant="outline" onClick={onPromoteAdmitted}>
			<UserCheck className="mr-2 h-4 w-4" />
			{t("admin.deliberations.promote.button")}
		</Button>
	);

	const exportButtons = (
		<>
			<Button
				variant="outline"
				onClick={() => pdfExport.mutate()}
				disabled={pdfExport.isPending}
			>
				{pdfExport.isPending ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Download className="mr-2 h-4 w-4" />
				)}
				PDF
			</Button>
			<Button
				variant="outline"
				onClick={() => excelExport.mutate()}
				disabled={excelExport.isPending}
			>
				{excelExport.isPending ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<FileSpreadsheet className="mr-2 h-4 w-4" />
				)}
				Excel
			</Button>
		</>
	);

	return (
		<div className="flex items-center gap-2">
			{status === "draft" && (
				<Button
					onClick={() => transition.mutate("open")}
					disabled={transition.isPending}
				>
					<Play className="mr-2 h-4 w-4" />
					{t("admin.deliberations.actions.open")}
				</Button>
			)}
			{status === "open" && (
				<>
					<Button
						variant="outline"
						onClick={() => compute.mutate()}
						disabled={compute.isPending}
					>
						{compute.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Gavel className="mr-2 h-4 w-4" />
						)}
						{compute.isPending
							? t("admin.deliberations.actions.computing")
							: t("admin.deliberations.actions.compute")}
					</Button>
					<Button
						onClick={() =>
							confirmTransition("close", {
								title: t("admin.deliberations.confirm.closeTitle"),
								message: t("admin.deliberations.confirm.close"),
								confirmText: t("admin.deliberations.actions.close"),
							})
						}
						disabled={transition.isPending}
					>
						<Lock className="mr-2 h-4 w-4" />
						{t("admin.deliberations.actions.close")}
					</Button>
				</>
			)}
			{status === "closed" && (
				<>
					<Button
						variant="outline"
						onClick={() =>
							confirmTransition("reopen", {
								title: t("admin.deliberations.confirm.reopenTitle"),
								message: t("admin.deliberations.confirm.reopen"),
								confirmText: t("admin.deliberations.actions.reopen"),
							})
						}
						disabled={transition.isPending}
					>
						{t("admin.deliberations.actions.reopen")}
					</Button>
					{promoteButton}
					{exportButtons}
					<Button
						onClick={() =>
							confirmTransition("sign", {
								title: t("admin.deliberations.confirm.signTitle"),
								message: t("admin.deliberations.confirm.sign"),
								confirmText: t("admin.deliberations.actions.sign"),
							})
						}
						disabled={transition.isPending}
					>
						<FileSignature className="mr-2 h-4 w-4" />
						{t("admin.deliberations.actions.sign")}
					</Button>
				</>
			)}
			{status === "signed" && (
				<>
					{promoteButton}
					{exportButtons}
				</>
			)}
		</div>
	);
}
