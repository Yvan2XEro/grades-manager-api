import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

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
