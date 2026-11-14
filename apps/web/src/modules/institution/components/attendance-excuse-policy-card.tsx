import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useSaveInstitutionMetadata } from "../hooks/use-institution-settings";
import type { AttendanceExcusePolicy } from "../types";

interface Props {
	institutionId: string;
	currentMetadata: Record<string, unknown>;
	initialPolicy: AttendanceExcusePolicy;
}

/** Which absence excuses are accepted, saved to the institution metadata. */
export function AttendanceExcusePolicyCard({
	institutionId,
	currentMetadata,
	initialPolicy,
}: Props) {
	const { t } = useTranslation();
	const [acceptedCategories, setAcceptedCategories] = useState(
		(initialPolicy.acceptedCategories ?? []).join(", "),
	);
	const [requiresDocument, setRequiresDocument] = useState(
		initialPolicy.requiresDocument ?? false,
	);
	const [approvalDeadlineDays, setApprovalDeadlineDays] = useState(
		initialPolicy.approvalDeadlineDays?.toString() ?? "",
	);
	const saveMutation = useSaveInstitutionMetadata(
		institutionId,
		currentMetadata,
	);

	const save = () =>
		saveMutation.mutate({
			attendance_excuse_policy: {
				acceptedCategories: acceptedCategories
					.split(",")
					.map((item) => item.trim())
					.filter(Boolean),
				requiresDocument,
				approvalDeadlineDays:
					approvalDeadlineDays.trim() === ""
						? null
						: Number(approvalDeadlineDays),
			},
		});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ClipboardCheck className="h-5 w-5" />
					{t("admin.institution.attendanceExcusePolicy.title")}
				</CardTitle>
				<CardDescription>
					{t("admin.institution.attendanceExcusePolicy.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<label className="font-medium text-sm">
						{t("admin.institution.attendanceExcusePolicy.categories")}
					</label>
					<Input
						value={acceptedCategories}
						onChange={(event) => setAcceptedCategories(event.target.value)}
						placeholder={t(
							"admin.institution.attendanceExcusePolicy.categoriesPlaceholder",
						)}
					/>
					<p className="text-muted-foreground text-xs">
						{t("admin.institution.attendanceExcusePolicy.categoriesHint")}
					</p>
				</div>
				<div className="flex items-center justify-between rounded-md border p-3">
					<div>
						<p className="font-medium text-sm">
							{t("admin.institution.attendanceExcusePolicy.requiresDocument")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t(
								"admin.institution.attendanceExcusePolicy.requiresDocumentHint",
							)}
						</p>
					</div>
					<Switch
						checked={requiresDocument}
						onCheckedChange={setRequiresDocument}
					/>
				</div>
				<div className="max-w-xs space-y-1.5">
					<label className="font-medium text-sm">
						{t("admin.institution.attendanceExcusePolicy.deadline")}
					</label>
					<Input
						type="number"
						min={0}
						value={approvalDeadlineDays}
						onChange={(event) => setApprovalDeadlineDays(event.target.value)}
						placeholder="7"
					/>
					<p className="text-muted-foreground text-xs">
						{t("admin.institution.attendanceExcusePolicy.deadlineHint")}
					</p>
				</div>
				<div className="flex justify-end">
					<Button
						type="button"
						disabled={saveMutation.isPending}
						onClick={save}
					>
						{saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
						{t("common.actions.save")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
