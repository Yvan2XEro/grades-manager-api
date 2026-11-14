import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { API_KEYS_KEY } from "../hooks/use-api-keys";
import { SecretInput } from "./secret-input";

/**
 * Generates an API key; resolves with the raw key (shown only once, never
 * stored server-side), or `undefined` when dismissed.
 */
export const CreateApiKeyDialog = createCallable<void, string | undefined>(
	({ call }) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const [label, setLabel] = useState("");
		const [webhookUrl, setWebhookUrl] = useState("");
		const [webhookSecret, setWebhookSecret] = useState("");

		const create = useMutationFlow(call, async (call) => {
			try {
				const data = await trpcClient.diplomationKeys.create.mutate({
					label: label.trim(),
					webhookUrl: webhookUrl.trim() || undefined,
					webhookSecret: webhookSecret.trim() || undefined,
				});
				queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
				call.end(data.rawKey);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.apiKeys.toast.createError"),
				);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={undefined}
				preventDismiss={create.pending}
				title={t("admin.apiKeys.form.createTitle")}
			>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="key-label">{t("admin.apiKeys.form.label")}</Label>
						<Input
							id="key-label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder={t("admin.apiKeys.form.labelPlaceholder")}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="webhook-url">
							{t("admin.apiKeys.form.webhookUrl")}
						</Label>
						<Input
							id="webhook-url"
							value={webhookUrl}
							onChange={(e) => setWebhookUrl(e.target.value)}
							placeholder="http://localhost:4242/webhook"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="webhook-secret">
							{t("admin.apiKeys.form.webhookSecret")}
						</Label>
						<SecretInput
							id="webhook-secret"
							value={webhookSecret}
							onChange={setWebhookSecret}
							placeholder={t("admin.apiKeys.form.webhookSecretPlaceholder")}
						/>
					</div>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="ghost"
							type="button"
							disabled={create.pending}
							onClick={() => call.end(undefined)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							type="button"
							disabled={!label.trim() || create.pending}
							onClick={() => create()}
						>
							{create.pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
							{t("admin.apiKeys.actions.generate")}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
