import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ineligibilityLabel } from "@/lib/document-errors";
import type { useBulkDocumentGeneration } from "../hooks/use-bulk-document-generation";
import { GenerationStatusBadge } from "./generation-status-badge";

type State = ReturnType<typeof useBulkDocumentGeneration>;

/** Students of the class with a checkbox, their generation status and a preview button. */
export function BulkDocumentStudentsTable({ state }: { state: State }) {
	const { t } = useTranslation();
	const {
		studentItems,
		allSelected,
		toggleAll,
		selectedIds,
		toggleOne,
		genStatus,
		previewOne,
	} = state;
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-10">
						<Checkbox
							checked={allSelected}
							onCheckedChange={toggleAll}
							aria-label={t("admin.documents.bulk.table.selectAll")}
						/>
					</TableHead>
					<TableHead>
						{t("admin.documents.bulk.table.registrationNumber")}
					</TableHead>
					<TableHead>{t("admin.documents.bulk.table.lastName")}</TableHead>
					<TableHead>{t("admin.documents.bulk.table.firstName")}</TableHead>
					<TableHead>{t("admin.documents.bulk.table.eligibility")}</TableHead>
					<TableHead className="w-32">
						{t("admin.documents.bulk.table.status")}
					</TableHead>
					<TableHead className="w-12 text-right">
						{t("admin.documents.bulk.table.preview")}
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{studentItems.map((s) => {
					const status = genStatus[s.id];
					return (
						<TableRow
							key={s.id}
							className={s.eligible ? undefined : "text-muted-foreground"}
						>
							<TableCell>
								<Checkbox
									checked={selectedIds.has(s.id)}
									disabled={!s.eligible}
									onCheckedChange={() => toggleOne(s.id)}
									aria-label={t("admin.documents.bulk.table.selectOne", {
										name: s.profile.firstName,
									})}
								/>
							</TableCell>
							<TableCell className="font-mono text-xs">
								{s.registrationNumber}
							</TableCell>
							<TableCell>{s.profile.lastName}</TableCell>
							<TableCell>{s.profile.firstName}</TableCell>
							<TableCell>
								{s.eligible ? (
									<Badge variant="secondary">
										{t("admin.documents.bulk.table.eligible")}
									</Badge>
								) : (
									<span className="text-amber-700 text-xs dark:text-amber-400">
										{ineligibilityLabel(t, s.reason, s.decision)}
									</span>
								)}
							</TableCell>
							<TableCell>
								<GenerationStatusBadge status={status} />
							</TableCell>
							<TableCell className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => previewOne.mutate(s.id)}
									disabled={previewOne.isPending || !s.eligible}
									title={t("admin.documents.bulk.table.previewFor", {
										name: `${s.profile.firstName} ${s.profile.lastName}`,
									})}
								>
									{previewOne.isPending && previewOne.variables === s.id ? (
										<Spinner className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
