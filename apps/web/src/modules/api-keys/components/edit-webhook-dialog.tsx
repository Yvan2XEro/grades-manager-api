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
import type { ApiKey } from "../types";
import { SecretInput } from "./secret-input";

/** Edits the webhook of an API key; resolves `true` once saved. */
export const EditWebhookDialog = createCallable<{ apiKey: ApiKey }, boolean>(
	({ call, apiKey }) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const [webhookUrl, setWebhookUrl] = useState(apiKey.webhookUrl ?? "");
		const [webhookSecret, setWebhookSecret] = useState("");

		const save = useMutationFlow(call, async (call) => {
			try {
				await trpcClient.diplomationKeys.updateWebhook.mutate({
					id: apiKey.id,
					webhookUrl: webhookUrl.trim() || null,
					webhookSecret: webhookSecret.trim() || null,
				});
				toast.success(t("admin.apiKeys.toast.webhookUpdated"));
				queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
				call.end(true);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.apiKeys.toast.webhookError"),
				);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={save.pending}
				title={t("admin.apiKeys.webhook.title")}
			>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="edit-webhook-url">
							{t("admin.apiKeys.form.webhookUrl")}
						</Label>
						<Input
							id="edit-webhook-url"
							value={webhookUrl}
							onChange={(e) => setWebhookUrl(e.target.value)}
							placeholder="http://localhost:4242/webhook"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-webhook-secret">
							{t("admin.apiKeys.form.webhookSecret")}
						</Label>
						<SecretInput
							id="edit-webhook-secret"
							value={webhookSecret}
							onChange={setWebhookSecret}
							placeholder={t("admin.apiKeys.form.webhookSecretPlaceholder")}
						/>
					</div>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="ghost"
							type="button"
							disabled={save.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							type="button"
							disabled={save.pending}
							onClick={() => save()}
						>
							{save.pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
							{t("common.actions.save")}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
