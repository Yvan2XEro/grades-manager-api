import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

/** Grants grade-editing rights on an exam; resolves `true` once assigned. */
export const AssignDelegateDialog = createCallable<{ examId: string }, boolean>(
	({ call, examId }) => {
		const { t } = useTranslation();
		const [editorProfileId, setEditorProfileId] = useState("");

		const candidatesQuery = useQuery({
			queryKey: ["grade-editor-candidates"],
			queryFn: async () => {
				const { items } = await trpcClient.users.list.query({
					roles: ["administrator", "dean", "teacher", "staff"],
					limit: 100,
				});
				return items;
			},
		});

		const assign = useMutationFlow(call, async (call) => {
			try {
				await trpcClient.examGradeEditors.assign.mutate({
					examId,
					editorProfileId,
				});
				toast.success(t("teacher.gradeEntry.delegates.assignSuccess"));
				call.end(true);
			} catch (error) {
				toast.error(
					(error as Error).message ||
						t("teacher.gradeEntry.delegates.assignError"),
				);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={assign.pending}
				title={t("teacher.gradeEntry.delegates.dialogTitle")}
				description={t("teacher.gradeEntry.delegates.dialogDescription")}
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{t("teacher.gradeEntry.delegates.selectLabel")}</Label>
						<Select
							value={editorProfileId || undefined}
							onValueChange={setEditorProfileId}
							disabled={candidatesQuery.isLoading}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t(
										"teacher.gradeEntry.delegates.selectPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{candidatesQuery.data?.map((user) => (
									<SelectItem key={user.id} value={user.id}>
										{user.firstName} {user.lastName} •{" "}
										{user.primaryEmail ??
											t("teacher.gradeEntry.delegates.unknownEmail")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={assign.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							type="button"
							onClick={() => assign()}
							disabled={!editorProfileId || assign.pending}
						>
							{assign.pending ? (
								<Spinner className="mr-2 h-4 w-4 text-white" />
							) : (
								<UserPlus className="mr-2 h-4 w-4" />
							)}
							{t("teacher.gradeEntry.delegates.add")}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
