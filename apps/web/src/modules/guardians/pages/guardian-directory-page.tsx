import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { AddGuardianDialog } from "../components/add-guardian-dialog";
import { GuardianPreferencesSheet } from "../components/guardian-preferences-sheet";
import { GuardianRowActions } from "../components/guardian-row-actions";
import { GuardiansTable } from "../components/guardians-table";
import {
	useDeleteGuardian,
	useGuardians,
	useRefreshGuardians,
	useRemoveGuardianLink,
} from "../hooks/use-guardians";
import {
	DEFAULT_PREFERENCES,
	type GuardianRow,
	type PreferencesType,
} from "../types";

export default function GuardianDirectoryPage() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);

	const { data, guardians, isLoading } = useGuardians({
		page,
		pageSize,
		search: debouncedSearch || undefined,
	});
	const refresh = useRefreshGuardians();
	const removeLink = useRemoveGuardianLink();
	const deleteGuardian = useDeleteGuardian();

	const copyPortalLink = (g: GuardianRow) => {
		void navigator.clipboard.writeText(
			`${window.location.origin}/guardian/portal?token=${g.accessToken}`,
		);
		toast.success(t("guardians.admin.toasts.linkCopied"));
	};

	const confirmDelete = (guardianId: string) =>
		confirmAction({
			title: t("common.confirmDelete"),
			message: t("guardians.admin.deleteConfirm", {
				defaultValue:
					"This will permanently delete the guardian and all student links.",
			}),
			confirmText: t("common.delete"),
			cancelText: t("common.cancel"),
			onConfirm: () =>
				deleteGuardian.mutateAsync(guardianId).catch(() => undefined),
		});

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("guardians.admin.title")}
					description={t("guardians.admin.subtitle")}
					actions={
						<Button
							onClick={() => AddGuardianDialog.call({ onCreated: refresh })}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("guardians.admin.addGuardian", {
								defaultValue: "Add guardian",
							})}
						</Button>
					}
				/>
			}
			toolbar={
				<div className="relative max-w-sm">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={t("guardians.admin.searchPlaceholder", {
							defaultValue: "Search by name or email…",
						})}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>
			}
			footer={
				<TablePagination
					page={page}
					pageCount={data?.pageCount ?? 1}
					total={data?.total ?? 0}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={(s) => {
						setPageSize(s);
						setPage(1);
					}}
				/>
			}
		>
			{isLoading ? (
				<TableSkeleton columns={6} rows={6} />
			) : (
				<GuardiansTable
					guardians={guardians}
					renderActions={(g) => (
						<GuardianRowActions
							guardian={g}
							onCopyPortalLink={() => copyPortalLink(g)}
							onEditPreferences={() =>
								GuardianPreferencesSheet.call({
									onSaved: refresh,
									id: g.id,
									name: `${g.firstName} ${g.lastName}`,
									preferences: {
										...DEFAULT_PREFERENCES,
										...(g.preferences as PreferencesType),
									},
								})
							}
							onRemoveLink={(studentId) =>
								removeLink.mutate({ guardianId: g.id, studentId })
							}
							onDelete={() => confirmDelete(g.id)}
						/>
					)}
				/>
			)}
		</ListLayout>
	);
}
