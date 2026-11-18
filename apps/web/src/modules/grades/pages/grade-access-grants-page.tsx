import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { GrantGradeAccessDialog } from "../components/grant-grade-access-dialog";
import {
	useGradeAccessGrants,
	useRevokeGradeAccess,
} from "../hooks/use-grade-access-grants";
import { getGradeAccessGrantsColumns } from "../table/grade-access-grants-columns";
import type { GradeAccessGrantRow } from "../types";

/** Profiles allowed to edit the grades of every exam (exams hub tab). */
export default function GradeAccessGrants() {
	const { t } = useTranslation();
	const { grants, isLoading } = useGradeAccessGrants();
	const revokeMutation = useRevokeGradeAccess();
	const columns = useMemo(() => getGradeAccessGrantsColumns(t), [t]);

	const confirmRevoke = (id: string) =>
		confirmAction({
			title: t("admin.gradeAccessGrants.revoke.title"),
			message: t("admin.gradeAccessGrants.revoke.message"),
			confirmText: t("admin.gradeAccessGrants.actions.revoke"),
			onConfirm: () => revokeMutation.mutateAsync(id).catch(() => undefined),
		});

	const rowActions = (grant: GradeAccessGrantRow): RowAction[] => [
		{
			label: t("admin.gradeAccessGrants.actions.revoke"),
			icon: Trash2,
			destructive: true,
			onSelect: () => confirmRevoke(grant.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.gradeAccessGrants.title")}
					description={t("admin.gradeAccessGrants.subtitle")}
					actions={
						<Button onClick={() => GrantGradeAccessDialog.call()}>
							<UserPlus className="mr-2 h-4 w-4" />
							{t("admin.gradeAccessGrants.actions.add")}
						</Button>
					}
				/>
			}
			toolbar={
				<div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary text-sm">
					{t("admin.gradeAccessGrants.info")}
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={grants}
				isLoading={isLoading}
				rowActions={rowActions}
				empty={
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
				}
			/>
		</ListLayout>
	);
}
