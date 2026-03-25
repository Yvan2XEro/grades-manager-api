import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Key, Plus, Trash2, Webhook } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { toast } from "@/lib/toast";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DialogFooter } from "../../components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "../../components/ui/table-skeleton";
import { trpcClient } from "../../utils/trpc";

type ApiKey = {
	id: string;
	label: string;
	isActive: boolean;
	webhookUrl: string | null;
	lastUsedAt: string | Date | null;
	createdAt: string | Date;
};

export default function ApiKeysManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isWebhookOpen, setIsWebhookOpen] = useState(false);
	const [revokeId, setRevokeId] = useState<string | null>(null);
	const [newRawKey, setNewRawKey] = useState<string | null>(null);
	const [editingKey, setEditingKey] = useState<ApiKey | null>(null);

	// Create form state
	const [label, setLabel] = useState("");
	const [webhookUrl, setWebhookUrl] = useState("");
	const [webhookSecret, setWebhookSecret] = useState("");
	const [showSecret, setShowSecret] = useState(false);

	// Webhook form state
	const [editWebhookUrl, setEditWebhookUrl] = useState("");
	const [editWebhookSecret, setEditWebhookSecret] = useState("");
	const [showEditSecret, setShowEditSecret] = useState(false);

	const { data: keys = [], isLoading } = useQuery({
		queryKey: ["diplomation-api-keys"],
		queryFn: () => trpcClient.diplomationKeys.list.query(),
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			return trpcClient.diplomationKeys.create.mutate({
				label: label.trim(),
				webhookUrl: webhookUrl.trim() || undefined,
				webhookSecret: webhookSecret.trim() || undefined,
			});
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["diplomation-api-keys"] });
			setIsCreateOpen(false);
			setLabel("");
			setWebhookUrl("");
			setWebhookSecret("");
			setNewRawKey(data.rawKey);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: t("admin.apiKeys.toast.createError");
			toast.error(message);
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.diplomationKeys.revoke.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.apiKeys.toast.revokeSuccess"));
			queryClient.invalidateQueries({ queryKey: ["diplomation-api-keys"] });
			setRevokeId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: t("admin.apiKeys.toast.revokeError");
			toast.error(message);
		},
	});

	const updateWebhookMutation = useMutation({
		mutationFn: async () => {
			if (!editingKey) return;
			await trpcClient.diplomationKeys.updateWebhook.mutate({
				id: editingKey.id,
				webhookUrl: editWebhookUrl.trim() || null,
				webhookSecret: editWebhookSecret.trim() || null,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.apiKeys.toast.webhookUpdated"));
			queryClient.invalidateQueries({ queryKey: ["diplomation-api-keys"] });
			setIsWebhookOpen(false);
			setEditingKey(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: t("admin.apiKeys.toast.webhookError");
			toast.error(message);
		},
	});

	const handleOpenWebhook = (key: ApiKey) => {
		setEditingKey(key);
		setEditWebhookUrl(key.webhookUrl ?? "");
		setEditWebhookSecret("");
		setShowEditSecret(false);
		setIsWebhookOpen(true);
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			toast.success(t("admin.apiKeys.toast.copied"));
		});
	};

	const formatDate = (d: string | Date | null) => {
		if (!d) return "—";
		return new Date(d).toLocaleDateString();
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-foreground">{t("admin.apiKeys.title")}</h1>
					<p className="text-muted-foreground">{t("admin.apiKeys.subtitle")}</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.apiKeys.actions.create")}
				</Button>
			</div>

			<Card>
				<CardContent>
					{isLoading ? (
						<TableSkeleton columns={5} rows={5} />
					) : keys.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.apiKeys.table.label")}</TableHead>
									<TableHead>{t("admin.apiKeys.table.status")}</TableHead>
									<TableHead>{t("admin.apiKeys.table.webhook")}</TableHead>
									<TableHead>{t("admin.apiKeys.table.lastUsed")}</TableHead>
									<TableHead>{t("admin.apiKeys.table.created")}</TableHead>
									<TableHead className="w-[100px] text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(keys as ApiKey[]).map((key) => (
									<TableRow
										key={key.id}
										actions={
											<>
												<ContextMenuItem
													onSelect={() => handleOpenWebhook(key)}
												>
													<span>{t("admin.apiKeys.actions.editWebhook")}</span>
												</ContextMenuItem>
												<ContextMenuSeparator />
												<ContextMenuItem
													variant="destructive"
													onSelect={() => setRevokeId(key.id)}
													disabled={!key.isActive}
												>
													<span>{t("admin.apiKeys.actions.revoke")}</span>
												</ContextMenuItem>
											</>
										}
									>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												<Key className="h-3.5 w-3.5 text-muted-foreground" />
												{key.label}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={key.isActive ? "default" : "secondary"}>
												{key.isActive
													? t("common.status.active")
													: t("admin.apiKeys.status.revoked")}
											</Badge>
										</TableCell>
										<TableCell>
											{key.webhookUrl ? (
												<span className="block max-w-[200px] truncate text-muted-foreground text-xs">
													{key.webhookUrl}
												</span>
											) : (
												"—"
											)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{formatDate(key.lastUsedAt)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{formatDate(key.createdAt)}
										</TableCell>
										<TableCell className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleOpenWebhook(key)}
												title={t("admin.apiKeys.actions.editWebhook")}
											>
												<Webhook className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setRevokeId(key.id)}
												disabled={!key.isActive}
												title={t("admin.apiKeys.actions.revoke")}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>{t("admin.apiKeys.empty.title")}</EmptyTitle>
								<EmptyDescription>
									{t("admin.apiKeys.empty.description")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent />
						</Empty>
					)}
				</CardContent>
			</Card>

			{/* Create key modal */}
			<FormModal
				isOpen={isCreateOpen}
				onClose={() => {
					setIsCreateOpen(false);
					setLabel("");
					setWebhookUrl("");
					setWebhookSecret("");
				}}
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
						<div className="relative">
							<Input
								id="webhook-secret"
								type={showSecret ? "text" : "password"}
								value={webhookSecret}
								onChange={(e) => setWebhookSecret(e.target.value)}
								placeholder={t("admin.apiKeys.form.webhookSecretPlaceholder")}
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowSecret((v) => !v)}
								className="-translate-y-1/2 absolute top-1/2 right-2.5 text-muted-foreground hover:text-foreground"
							>
								{showSecret ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							type="button"
							onClick={() => setIsCreateOpen(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							type="button"
							disabled={!label.trim() || createMutation.isPending}
							onClick={() => createMutation.mutate()}
						>
							{createMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : null}
							{t("admin.apiKeys.actions.generate")}
						</Button>
					</DialogFooter>
				</div>
			</FormModal>

			{/* Raw key display modal — shown once after creation */}
			<FormModal
				isOpen={!!newRawKey}
				onClose={() => setNewRawKey(null)}
				title={t("admin.apiKeys.rawKey.title")}
			>
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">
						{t("admin.apiKeys.rawKey.warning")}
					</p>
					<div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
						<code className="flex-1 select-all break-all font-mono text-xs">
							{newRawKey}
						</code>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => newRawKey && copyToClipboard(newRawKey)}
						>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
					<DialogFooter>
						<Button onClick={() => setNewRawKey(null)}>
							{t("admin.apiKeys.rawKey.confirm")}
						</Button>
					</DialogFooter>
				</div>
			</FormModal>

			{/* Edit webhook modal */}
			<FormModal
				isOpen={isWebhookOpen}
				onClose={() => {
					setIsWebhookOpen(false);
					setEditingKey(null);
				}}
				title={t("admin.apiKeys.webhook.title")}
			>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="edit-webhook-url">
							{t("admin.apiKeys.form.webhookUrl")}
						</Label>
						<Input
							id="edit-webhook-url"
							value={editWebhookUrl}
							onChange={(e) => setEditWebhookUrl(e.target.value)}
							placeholder="http://localhost:4242/webhook"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-webhook-secret">
							{t("admin.apiKeys.form.webhookSecret")}
						</Label>
						<div className="relative">
							<Input
								id="edit-webhook-secret"
								type={showEditSecret ? "text" : "password"}
								value={editWebhookSecret}
								onChange={(e) => setEditWebhookSecret(e.target.value)}
								placeholder={t("admin.apiKeys.form.webhookSecretPlaceholder")}
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowEditSecret((v) => !v)}
								className="-translate-y-1/2 absolute top-1/2 right-2.5 text-muted-foreground hover:text-foreground"
							>
								{showEditSecret ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							type="button"
							onClick={() => setIsWebhookOpen(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							type="button"
							disabled={updateWebhookMutation.isPending}
							onClick={() => updateWebhookMutation.mutate()}
						>
							{updateWebhookMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : null}
							{t("common.actions.save")}
						</Button>
					</DialogFooter>
				</div>
			</FormModal>

			{/* Revoke confirm */}
			<ConfirmModal
				isOpen={!!revokeId}
				onClose={() => setRevokeId(null)}
				onConfirm={() => revokeId && revokeMutation.mutate(revokeId)}
				title={t("admin.apiKeys.revoke.title")}
				message={t("admin.apiKeys.revoke.message")}
				isLoading={revokeMutation.isPending}
			/>
		</div>
	);
}
