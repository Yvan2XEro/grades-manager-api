import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, Trash2, Webhook } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { confirmAction } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ApiKey } from "@/utils/type";
import {
	CreateApiKeyDialog,
	EditWebhookDialog,
	RawApiKeyDialog,
} from "./ApiKeyDialogs";

export default function ApiKeysManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const ACTIVITY_DAYS = 30;
	const SERIES_COLORS = [
		"var(--chart-1)",
		"var(--chart-2)",
		"var(--chart-3)",
		"var(--chart-4)",
		"var(--chart-5)",
	];

	const { data: keys = [], isLoading } = useQuery({
		queryKey: ["diplomation-api-keys"],
		queryFn: () => trpcClient.diplomationKeys.list.query(),
	});

	const { data: activityData } = useQuery(
		trpc.diplomationKeys.activityStats.queryOptions({ days: ACTIVITY_DAYS }),
	);

	const { data: callData } = useQuery(
		trpc.diplomationKeys.callStats.queryOptions({ days: ACTIVITY_DAYS }),
	);

	const { labelMap, allKeyIds, chartData } = useMemo(() => {
		const labelMap = new Map(
			(activityData?.keyLabels ?? []).map((k) => [k.id, k.label]),
		);
		const allKeyIds = [...labelMap.keys()];
		if (activityData?.rows.some((r) => r.apiKeyId === null)) {
			allKeyIds.push("unknown");
		}

		const byDate = new Map<string, Record<string, number>>();
		for (const row of activityData?.rows ?? []) {
			const key = row.apiKeyId ?? "unknown";
			if (!byDate.has(row.date)) byDate.set(row.date, {});
			const entry = byDate.get(row.date)!;
			entry[key] = (entry[key] ?? 0) + row.count;
		}

		const chartData: Record<string, number | string>[] = [];
		for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const iso = d.toISOString().slice(0, 10);
			const display = d.toLocaleDateString("fr-FR", {
				month: "2-digit",
				day: "2-digit",
			});
			chartData.push({ date: display, ...(byDate.get(iso) ?? {}) });
		}

		return { labelMap, allKeyIds, chartData };
	}, [activityData]);

	const { callLabelMap, callKeyIds, callChartData } = useMemo(() => {
		const callLabelMap = new Map(
			(callData?.keyLabels ?? []).map((k) => [k.id, k.label]),
		);
		const callKeyIds = [...callLabelMap.keys()];
		if (callData?.rows.some((r) => r.apiKeyId === null)) {
			callKeyIds.push("unknown");
		}

		const byDate = new Map<string, Record<string, number>>();
		for (const row of callData?.rows ?? []) {
			const key = row.apiKeyId ?? "unknown";
			if (!byDate.has(row.date)) byDate.set(row.date, {});
			const entry = byDate.get(row.date)!;
			entry[key] = (entry[key] ?? 0) + row.count;
		}

		const callChartData: Record<string, number | string>[] = [];
		for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const iso = d.toISOString().slice(0, 10);
			const display = d.toLocaleDateString("fr-FR", {
				month: "2-digit",
				day: "2-digit",
			});
			callChartData.push({ date: display, ...(byDate.get(iso) ?? {}) });
		}

		return { callLabelMap, callKeyIds, callChartData };
	}, [callData]);

	const createKey = async () => {
		const rawKey = await CreateApiKeyDialog.call();
		if (rawKey) await RawApiKeyDialog.call({ rawKey });
	};

	const revokeMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.diplomationKeys.revoke.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.apiKeys.toast.revokeSuccess"));
			queryClient.invalidateQueries({ queryKey: ["diplomation-api-keys"] });
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: t("admin.apiKeys.toast.revokeError");
			toast.error(message);
		},
	});

	const handleOpenWebhook = (apiKey: ApiKey) =>
		EditWebhookDialog.call({ apiKey });

	const confirmRevoke = (id: string) =>
		confirmAction({
			title: t("admin.apiKeys.revoke.title"),
			message: t("admin.apiKeys.revoke.message"),
			onConfirm: () => revokeMutation.mutateAsync(id).catch(() => undefined),
		});

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
				<Button onClick={createKey}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.apiKeys.actions.create")}
				</Button>
			</div>

			{/* Activity chart */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						{t("admin.apiKeys.activity.title", {
							defaultValue: "Activité — 30 derniers jours",
						})}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{allKeyIds.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							{t("admin.apiKeys.activity.empty", {
								defaultValue: "Aucune activité enregistrée.",
							})}
						</p>
					) : (
						<div className="h-52">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={chartData}
									margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
								>
									<defs>
										{allKeyIds.map((keyId, i) => (
											<linearGradient
												key={keyId}
												id={`grad-${i}`}
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
													stopOpacity={0.3}
												/>
												<stop
													offset="95%"
													stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
													stopOpacity={0.02}
												/>
											</linearGradient>
										))}
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="var(--border)"
									/>
									<XAxis
										dataKey="date"
										tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
										interval="preserveStartEnd"
									/>
									<YAxis
										allowDecimals={false}
										tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
									/>
									<Tooltip
										contentStyle={{
											borderRadius: "8px",
											border: "1px solid var(--border)",
											backgroundColor: "var(--card)",
											fontSize: "12px",
											color: "var(--foreground)",
										}}
									/>
									<Legend
										formatter={(value) =>
											labelMap.get(value) ??
											t("admin.apiKeys.activity.unknownKey", {
												defaultValue: "Sans clé",
											})
										}
										wrapperStyle={{ fontSize: "11px" }}
									/>
									{allKeyIds.map((keyId, i) => (
										<Area
											key={keyId}
											type="monotone"
											dataKey={keyId}
											name={
												labelMap.get(keyId) ??
												t("admin.apiKeys.activity.unknownKey", {
													defaultValue: "Sans clé",
												})
											}
											stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
											fill={`url(#grad-${i})`}
											strokeWidth={2}
											dot={false}
											activeDot={{ r: 4 }}
										/>
									))}
								</AreaChart>
							</ResponsiveContainer>
						</div>
					)}
				</CardContent>
			</Card>

			{/* API call activity chart */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						{t("admin.apiKeys.callActivity.title", {
							defaultValue: "Appels API — 30 derniers jours",
						})}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{callKeyIds.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							{t("admin.apiKeys.callActivity.empty", {
								defaultValue: "Aucun appel enregistré.",
							})}
						</p>
					) : (
						<div className="h-52">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={callChartData}
									margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
								>
									<defs>
										{callKeyIds.map((keyId, i) => (
											<linearGradient
												key={keyId}
												id={`call-grad-${i}`}
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
													stopOpacity={0.3}
												/>
												<stop
													offset="95%"
													stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
													stopOpacity={0.02}
												/>
											</linearGradient>
										))}
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="var(--border)"
									/>
									<XAxis
										dataKey="date"
										tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
										interval="preserveStartEnd"
									/>
									<YAxis
										allowDecimals={false}
										tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
									/>
									<Tooltip
										contentStyle={{
											borderRadius: "8px",
											border: "1px solid var(--border)",
											backgroundColor: "var(--card)",
											fontSize: "12px",
											color: "var(--foreground)",
										}}
									/>
									<Legend
										formatter={(value) =>
											callLabelMap.get(value) ??
											t("admin.apiKeys.activity.unknownKey", {
												defaultValue: "Sans clé",
											})
										}
										wrapperStyle={{ fontSize: "11px" }}
									/>
									{callKeyIds.map((keyId, i) => (
										<Area
											key={keyId}
											type="monotone"
											dataKey={keyId}
											name={
												callLabelMap.get(keyId) ??
												t("admin.apiKeys.activity.unknownKey", {
													defaultValue: "Sans clé",
												})
											}
											stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
											fill={`url(#call-grad-${i})`}
											strokeWidth={2}
											dot={false}
											activeDot={{ r: 4 }}
										/>
									))}
								</AreaChart>
							</ResponsiveContainer>
						</div>
					)}
				</CardContent>
			</Card>

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
													onSelect={() => confirmRevoke(key.id)}
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
												onClick={() => confirmRevoke(key.id)}
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
		</div>
	);
}
