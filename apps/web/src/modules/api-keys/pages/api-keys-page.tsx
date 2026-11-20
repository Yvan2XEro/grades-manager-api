import { Plus, Trash2, Webhook } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { roleGuards, useStore } from "@/store";
import { ApiActivityChart } from "../components/api-activity-chart";
import { CreateApiKeyDialog } from "../components/create-api-key-dialog";
import { EditWebhookDialog } from "../components/edit-webhook-dialog";
import { RawApiKeyDialog } from "../components/raw-api-key-dialog";
import {
	useApiKeyActivity,
	useApiKeys,
	useRevokeApiKey,
} from "../hooks/use-api-keys";
import { getApiKeysColumns } from "../table/api-keys-columns";
import type { ApiKey } from "../types";

export default function ApiKeysPage() {
	const { t } = useTranslation();
	const { keys, isLoading } = useApiKeys();
	const { activity, calls } = useApiKeyActivity();
	const revokeMutation = useRevokeApiKey();
	const columns = useMemo(() => getApiKeysColumns(t), [t]);
	// Administrators audit keys; issuing, revoking and webhooks are super admin
	const role = useStore((state) => state.user?.role);
	const canManage = !!role && roleGuards.manageApiKeys.includes(role);

	const createKey = async () => {
		const rawKey = await CreateApiKeyDialog.call();
		if (rawKey) await RawApiKeyDialog.call({ rawKey });
	};

	const confirmRevoke = (id: string) =>
		confirmAction({
			title: t("admin.apiKeys.revoke.title"),
			message: t("admin.apiKeys.revoke.message"),
			onConfirm: () => revokeMutation.mutateAsync(id).catch(() => undefined),
		});

	const rowActions = (key: ApiKey): RowAction[] =>
		canManage ? manageActions(key) : [];

	const manageActions = (key: ApiKey): RowAction[] => [
		{
			label: t("admin.apiKeys.actions.editWebhook"),
			icon: Webhook,
			onSelect: () => EditWebhookDialog.call({ apiKey: key }),
		},
		{
			label: t("admin.apiKeys.actions.revoke"),
			icon: Trash2,
			destructive: true,
			separator: true,
			disabled: !key.isActive,
			onSelect: () => confirmRevoke(key.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.apiKeys.title")}
					description={t("admin.apiKeys.subtitle")}
					actions={
						canManage ? (
							<Button onClick={createKey}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.apiKeys.actions.create")}
							</Button>
						) : undefined
					}
				/>
			}
			toolbar={
				<div className="grid gap-4 lg:grid-cols-2">
					<ApiActivityChart
						title={t("admin.apiKeys.activity.title")}
						emptyText={t("admin.apiKeys.activity.empty")}
						series={activity}
						gradientPrefix="grad"
					/>
					<ApiActivityChart
						title={t("admin.apiKeys.callActivity.title")}
						emptyText={t("admin.apiKeys.callActivity.empty")}
						series={calls}
						gradientPrefix="call-grad"
					/>
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={keys}
				isLoading={isLoading}
				rowActions={rowActions}
				empty={
					<Empty>
						<EmptyHeader>
							<EmptyTitle>{t("admin.apiKeys.empty.title")}</EmptyTitle>
							<EmptyDescription>
								{t("admin.apiKeys.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent />
					</Empty>
				}
			/>
		</ListLayout>
	);
}
