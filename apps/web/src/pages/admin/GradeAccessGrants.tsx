import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { Spinner } from "@/components/ui/spinner";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpcClient } from "@/utils/trpc";

export default function GradeAccessGrants() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [addOpen, setAddOpen] = useState(false);
	const [selectedProfileId, setSelectedProfileId] = useState<string>("");
	const [revokeId, setRevokeId] = useState<string | null>(null);

	const grantsQuery = useQuery({
		queryKey: ["gradeAccessGrants"],
		queryFn: () => trpcClient.gradeAccessGrants.list.query(),
	});

	const candidatesQuery = useQuery({
		queryKey: ["gradeAccessGrants-candidates"],
		enabled: addOpen,
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				roles: ["administrator", "dean", "teacher", "staff"],
				limit: 200,
			});
			return items;
		},
	});

	const grantMutation = useMutation({
		mutationFn: (profileId: string) =>
			trpcClient.gradeAccessGrants.grant.mutate({ profileId }),
		onSuccess: () => {
			toast.success(t("admin.gradeAccessGrants.toast.granted"));
			queryClient.invalidateQueries({ queryKey: ["gradeAccessGrants"] });
			setAddOpen(false);
			setSelectedProfileId("");
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const revokeMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.gradeAccessGrants.revoke.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.gradeAccessGrants.toast.revoked"));
			queryClient.invalidateQueries({ queryKey: ["gradeAccessGrants"] });
			setRevokeId(null);
		},
		onError: (err) => toast.error((err as Error).message),
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
				<Button onClick={() => setAddOpen(true)}>
					<UserPlus className="mr-2 h-4 w-4" />
					{t("admin.gradeAccessGrants.actions.add")}
				</Button>
			</div>

			{/* Info banner */}
			<div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
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
							<EmptyTitle>{t("admin.gradeAccessGrants.empty.title")}</EmptyTitle>
							<EmptyDescription>
								{t("admin.gradeAccessGrants.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.gradeAccessGrants.columns.user")}</TableHead>
								<TableHead>{t("admin.gradeAccessGrants.columns.email")}</TableHead>
								<TableHead>{t("admin.gradeAccessGrants.columns.grantedBy")}</TableHead>
								<TableHead>{t("admin.gradeAccessGrants.columns.since")}</TableHead>
								<TableHead className="w-[60px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{grants.map((g: any) => (
								<TableRow key={g.id}>
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
											onClick={() => setRevokeId(g.id)}
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

			{/* Add delegate dialog */}
			<Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setSelectedProfileId(""); }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("admin.gradeAccessGrants.dialog.title")}</DialogTitle>
						<DialogDescription>
							{t("admin.gradeAccessGrants.dialog.description")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<Label>{t("admin.gradeAccessGrants.dialog.selectLabel")}</Label>
						<Select
							value={selectedProfileId || undefined}
							onValueChange={setSelectedProfileId}
							disabled={candidatesQuery.isLoading}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("admin.gradeAccessGrants.dialog.selectPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								{candidatesQuery.data?.map((user) => (
									<SelectItem key={user.id} value={user.id}>
										{user.firstName} {user.lastName} • {user.primaryEmail}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAddOpen(false)}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							disabled={!selectedProfileId || grantMutation.isPending}
							onClick={() => { if (selectedProfileId) grantMutation.mutate(selectedProfileId); }}
						>
							{grantMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
							{t("admin.gradeAccessGrants.actions.grant")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Revoke confirm */}
			<ConfirmModal
				open={!!revokeId}
				onOpenChange={(o) => { if (!o) setRevokeId(null); }}
				title={t("admin.gradeAccessGrants.revoke.title")}
				message={t("admin.gradeAccessGrants.revoke.message")}
				confirmLabel={t("admin.gradeAccessGrants.actions.revoke")}
				variant="destructive"
				onConfirm={() => { if (revokeId) revokeMutation.mutate(revokeId); }}
			/>
		</div>
	);
}
