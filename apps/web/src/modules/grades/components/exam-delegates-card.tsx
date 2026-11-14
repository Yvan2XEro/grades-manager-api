import { format } from "date-fns";
import { Trash2, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useRevokeDelegate } from "../hooks/use-grade-entry-mutations";
import type { Delegate } from "../types";
import { AssignDelegateDialog } from "./assign-delegate-dialog";

/** Grade-editing delegates of the selected exam: list, add, revoke. */
export function ExamDelegatesCard({
	selectedExam,
	delegates,
	isLoading,
	canEditExam,
	canManageDelegates,
	viewerProfileId,
	onChanged,
}: {
	selectedExam: string;
	delegates: Delegate[];
	isLoading: boolean;
	canEditExam: boolean;
	canManageDelegates: boolean;
	viewerProfileId?: string;
	/** Refetches the delegates after an assignment or a revocation. */
	onChanged: () => void;
}) {
	const { t } = useTranslation();
	const revokeDelegateMutation = useRevokeDelegate(selectedExam, onChanged);
	return (
		<Card>
			<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<CardTitle>{t("teacher.gradeEntry.delegates.title")}</CardTitle>
					<CardDescription>
						{t("teacher.gradeEntry.delegates.description")}
					</CardDescription>
				</div>
				{canEditExam && canManageDelegates && (
					<Button
						variant="outline"
						size="sm"
						onClick={async () => {
							if (await AssignDelegateDialog.call({ examId: selectedExam }))
								onChanged();
						}}
					>
						<UserPlus className="mr-2 h-4 w-4" />
						{t("teacher.gradeEntry.delegates.add")}
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-3">
				{isLoading ? (
					<div className="flex items-center justify-center py-6">
						<Spinner className="h-6 w-6 text-primary" />
					</div>
				) : delegates.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("teacher.gradeEntry.delegates.empty")}
					</p>
				) : (
					<div className="space-y-3">
						{delegates.map((delegate) => {
							const isSelfDelegate =
								Boolean(viewerProfileId) &&
								delegate.editor.id === viewerProfileId;
							const canRevokeThis =
								(canManageDelegates && canEditExam) || Boolean(isSelfDelegate);
							return (
								<div
									key={delegate.id}
									className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
								>
									<div>
										<p className="font-medium text-sm md:text-base">
											{delegate.editor.lastName}, {delegate.editor.firstName}
										</p>
										<p className="text-muted-foreground text-xs">
											{delegate.editor.primaryEmail ??
												t("teacher.gradeEntry.delegates.unknownEmail")}
										</p>
										<p className="text-muted-foreground text-xs">
											{t("teacher.gradeEntry.delegates.grantedAt", {
												date: format(new Date(delegate.createdAt), "PPp"),
											})}
										</p>
										{delegate.grantedBy?.id ? (
											<p className="text-muted-foreground text-xs">
												{t("teacher.gradeEntry.delegates.grantedBy", {
													name: `${delegate.grantedBy.lastName ?? ""} ${delegate.grantedBy.firstName ?? ""}`.trim(),
												})}
											</p>
										) : null}
										{!canRevokeThis &&
										!canManageDelegates &&
										!isSelfDelegate ? (
											<p className="text-muted-foreground text-xs">
												{t("teacher.gradeEntry.delegates.manageRestriction", {
													defaultValue:
														"Only the course owner can manage other delegates.",
												})}
											</p>
										) : null}
									</div>
									{canRevokeThis ? (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => revokeDelegateMutation.mutate(delegate.id)}
											disabled={revokeDelegateMutation.isPending}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											{isSelfDelegate && !canManageDelegates
												? t("teacher.gradeEntry.delegates.revokeSelf", {
														defaultValue: "Leave delegation",
													})
												: t("teacher.gradeEntry.delegates.revoke")}
										</Button>
									) : null}
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
