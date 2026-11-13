import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { confirmAction } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ContextMenuItem } from "@/components/ui/context-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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
import { trpcClient } from "@/utils/trpc";

export default function GradeAccessGrants() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const grantsQuery = useQuery({
		queryKey: ["gradeAccessGrants"],
		queryFn: () => trpcClient.gradeAccessGrants.list.query(),
	});

	const revokeMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.gradeAccessGrants.revoke.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.gradeAccessGrants.toast.revoked"));
			queryClient.invalidateQueries({ queryKey: ["gradeAccessGrants"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const confirmRevoke = (id: string) =>
		confirmAction({
			title: t("admin.gradeAccessGrants.revoke.title"),
			message: t("admin.gradeAccessGrants.revoke.message"),
			confirmText: t("admin.gradeAccessGrants.actions.revoke"),
			onConfirm: () => revokeMutation.mutateAsync(id).catch(() => undefined),
		});

	const grants = Array.isArray(grantsQuery.data) ? grantsQuery.data : [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<ShieldCheck className="h-6 w-6 text-primary" />
					<div>
						<h1 className="text-foreground">
							{t("admin.gradeAccessGrants.title")}
						</h1>
						<p className="text-muted-foreground text-xs">
							{t("admin.gradeAccessGrants.subtitle")}
						</p>
					</div>
				</div>
				<Button onClick={() => GrantGradeAccessDialog.call()}>
					<UserPlus className="mr-2 h-4 w-4" />
					{t("admin.gradeAccessGrants.actions.add")}
				</Button>
			</div>

			{/* Info banner */}
			<div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary text-sm">
				{t("admin.gradeAccessGrants.info")}
			</div>

			{/* Table */}
			<div className="rounded-xl border bg-card shadow-sm">
				{grantsQuery.isLoading ? (
					<TableSkeleton columns={4} rows={5} />
				) : grants.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<ShieldCheck className="text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>
								{t("admin.gradeAccessGrants.empty.title")}
							</EmptyTitle>
							<EmptyDescription>
								{t("admin.gradeAccessGrants.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("admin.gradeAccessGrants.columns.user")}
								</TableHead>
								<TableHead>
									{t("admin.gradeAccessGrants.columns.email")}
								</TableHead>
								<TableHead>
									{t("admin.gradeAccessGrants.columns.grantedBy")}
								</TableHead>
								<TableHead>
									{t("admin.gradeAccessGrants.columns.since")}
								</TableHead>
								<TableHead className="w-[60px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{grants.map((g: any) => (
								<TableRow
									key={g.id}
									actions={
										<ContextMenuItem
											variant="destructive"
											onSelect={() => confirmRevoke(g.id)}
										>
											<Trash2 className="h-4 w-4" />
											{t("admin.gradeAccessGrants.actions.revoke")}
										</ContextMenuItem>
									}
								>
									<TableCell className="font-medium">
										{[g.profile.firstName, g.profile.lastName]
											.filter(Boolean)
											.join(" ") || "—"}
										<Badge variant="outline" className="ml-2 text-[10px]">
											{g.profile.role}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{g.profile.primaryEmail}
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{g.grantedBy
											? [g.grantedBy.firstName, g.grantedBy.lastName]
													.filter(Boolean)
													.join(" ")
											: "—"}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{formatDistanceToNow(new Date(g.createdAt), {
											addSuffix: true,
										})}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive hover:text-destructive"
											onClick={() => confirmRevoke(g.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}

/** Grants grade-editing access to a staff profile; resolves `true` once granted. */
export const GrantGradeAccessDialog = createCallable<void, boolean>(
	({ call }) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const [selectedProfileId, setSelectedProfileId] = useState("");

		const candidatesQuery = useQuery({
			queryKey: ["gradeAccessGrants-candidates"],
			queryFn: async () => {
				const { items } = await trpcClient.users.list.query({
					roles: [
						"super_admin",
						"administrator",
						"dean",
						"teacher",
						"grade_editor",
					],
					limit: 200,
				});
				return items;
			},
		});

		const grant = useMutationFlow(call, async (call) => {
			try {
				await trpcClient.gradeAccessGrants.grant.mutate({
					profileId: selectedProfileId,
				});
				toast.success(t("admin.gradeAccessGrants.toast.granted"));
				queryClient.invalidateQueries({ queryKey: ["gradeAccessGrants"] });
				call.end(true);
			} catch (err) {
				toast.error((err as Error).message);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={grant.pending}
				className="sm:max-w-lg"
				title={t("admin.gradeAccessGrants.dialog.title")}
				description={t("admin.gradeAccessGrants.dialog.description")}
			>
				<div className="space-y-3">
					<Label>{t("admin.gradeAccessGrants.dialog.selectLabel")}</Label>
					<Combobox
						value={selectedProfileId}
						onValueChange={setSelectedProfileId}
						disabled={candidatesQuery.isLoading}
						placeholder={t("admin.gradeAccessGrants.dialog.selectPlaceholder")}
						searchPlaceholder={t("common.search", {
							defaultValue: "Rechercher...",
						})}
						options={
							candidatesQuery.data?.map(
								(user: {
									id: string;
									firstName: string;
									lastName: string;
									primaryEmail?: string | null;
								}) => ({
									value: user.id,
									label: `${user.firstName} ${user.lastName}`.trim(),
									description: user.primaryEmail ?? undefined,
								}),
							) ?? []
						}
					/>
				</div>
				<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						disabled={grant.pending}
						onClick={() => call.end(false)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						disabled={!selectedProfileId || grant.pending}
						onClick={() => grant()}
					>
						{grant.pending && <Spinner className="mr-2 h-4 w-4" />}
						{t("admin.gradeAccessGrants.actions.grant")}
					</Button>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
