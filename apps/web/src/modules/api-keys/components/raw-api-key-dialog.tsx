import { Copy } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

/** Shows a freshly generated raw key once, with a copy button. */
export const RawApiKeyDialog = createCallable<{ rawKey: string }>(
	({ call, rawKey }) => {
		const { t } = useTranslation();
		const copy = () =>
			navigator.clipboard.writeText(rawKey).then(() => {
				toast.success(t("admin.apiKeys.toast.copied"));
			});

		return (
			<CallableDialog
				call={call}
				dismissValue={undefined}
				title={t("admin.apiKeys.rawKey.title")}
			>
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">
						{t("admin.apiKeys.rawKey.warning")}
					</p>
					<div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
						<code className="flex-1 select-all break-all font-mono text-xs">
							{rawKey}
						</code>
						<Button variant="ghost" size="icon" onClick={copy}>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
					<div className="flex justify-end">
						<Button onClick={() => call.end()}>
							{t("admin.apiKeys.rawKey.confirm")}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
