import { Loader2, Unlock } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
	/** Reopens the jury; the dialog closes once it succeeds. */
	onConfirm: (reason: string) => Promise<unknown>;
}

/**
 * Reopening a signed jury (super admin only): the reason is required and
 * kept in the jury's activity log. The jury then has to be recomputed,
 * closed and signed again.
 */
export const ReopenSignedDialog = createCallable<Props, void>(
	({ call, onConfirm }) => {
		const { t } = useTranslation();
		const [reason, setReason] = useState("");
		const [pending, setPending] = useState(false);
		const submit = async () => {
			setPending(true);
			try {
				await onConfirm(reason.trim());
				call.end();
			} catch {
				// The error toast is shown by the mutation; keep the dialog open
			} finally {
				setPending(false);
			}
		};
		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t("admin.deliberations.reopenSigned.title")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.deliberations.reopenSigned.description")}
						</DialogDescription>
					</DialogHeader>
					<DialogBody className="space-y-2">
						<Label htmlFor="reopen-reason">
							{t("admin.deliberations.reopenSigned.reason")}
						</Label>
						<Textarea
							id="reopen-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t(
								"admin.deliberations.reopenSigned.reasonPlaceholder",
							)}
							rows={3}
						/>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => call.end()}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={submit}
							disabled={reason.trim().length < 3 || pending}
						>
							{pending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Unlock className="mr-2 h-4 w-4" />
							)}
							{t("admin.deliberations.actions.reopenSigned")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
