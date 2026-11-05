import { useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff } from "lucide-react";
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
import type { ApiKey } from "@/utils/type";

export const API_KEYS_KEY = ["diplomation-api-keys"];

function SecretInput({
	id,
	value,
	onChange,
	placeholder,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}) {
	const [visible, setVisible] = useState(false);
	return (
		<div className="relative">
			<Input
				id={id}
				type={visible ? "text" : "password"}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="pr-10"
			/>
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				className="-translate-y-1/2 absolute top-1/2 right-2.5 text-muted-foreground hover:text-foreground"
			>
				{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}

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
