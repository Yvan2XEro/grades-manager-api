import {
	Download,
	FileSignature,
	FileSpreadsheet,
	Gavel,
	Loader2,
	Lock,
	Play,
	Unlock,
	UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { useDeliberationActions } from "../hooks/use-deliberation";
import type { DeliberationAction } from "../types";
import { ReopenSignedDialog } from "./reopen-signed-dialog";

interface DeliberationDetailActionsProps {
	deliberationId: string;
	status: string;
	/** Students without a decision (incomplete results). */
	pendingCount: number;
	/** Whether the admitted students were already promoted. */
	promoted: boolean;
	/** Year-end juries promote; a semester jury does not. */
	canPromote: boolean;
	/** Marks changed since the last computation: recompute before closing. */
	outdated: boolean;
	/** Whether a jury president is named (warned about before signing). */
	hasPresident: boolean;
	onPromoteAdmitted: () => void;
}

/** Header buttons of a deliberation, depending on its workflow status. */
export function DeliberationDetailActions({
	deliberationId,
	status,
	pendingCount,
	promoted,
	canPromote,
	outdated,
	hasPresident,
	onPromoteAdmitted,
}: DeliberationDetailActionsProps) {
	const { t } = useTranslation();
	const { transition, compute, pdfExport, excelExport } =
		useDeliberationActions(deliberationId);

	const confirmTransition = (
		action: Exclude<DeliberationAction, "open">,
		texts: { title: string; message: string; confirmText: string },
	) =>
		confirmAction({
			...texts,
			onConfirm: () => transition.mutate({ action }),
		});

	const { user } = useStore();
	const isSuperAdmin = user?.role === "super_admin" || user?.role === "owner";
	const promoteButton =
		promoted || !canPromote ? null : (
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
					onClick={() => transition.mutate({ action: "open" })}
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
								message:
									pendingCount > 0
										? `${t("admin.deliberations.confirm.closeIncomplete", { count: pendingCount })} ${t("admin.deliberations.confirm.close")}`
										: t("admin.deliberations.confirm.close"),
								confirmText: t("admin.deliberations.actions.close"),
							})
						}
						disabled={transition.isPending || outdated}
						title={
							outdated
								? t("admin.deliberations.staleness.recompute")
								: undefined
						}
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
								message: hasPresident
									? t("admin.deliberations.confirm.sign")
									: `${t("admin.deliberations.confirm.signNoPresident")} ${t("admin.deliberations.confirm.sign")}`,
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
					{isSuperAdmin && (
						<Button
							variant="outline"
							onClick={() =>
								ReopenSignedDialog.call({
									onConfirm: (reason) =>
										transition.mutateAsync({ action: "reopen", reason }),
								})
							}
							disabled={transition.isPending}
						>
							<Unlock className="mr-2 h-4 w-4" />
							{t("admin.deliberations.actions.reopenSigned")}
						</Button>
					)}
					{promoteButton}
					{exportButtons}
				</>
			)}
		</div>
	);
}
