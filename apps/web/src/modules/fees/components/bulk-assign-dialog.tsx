import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import {
	type BulkAssignScope,
	useBulkAssign,
	useBulkAssignPreview,
} from "../hooks/use-bulk-assign";
import type { BulkMode } from "../types";
import { BulkAssignPreviewPanel } from "./bulk-assign-preview";
import { FeeStructureSelect } from "./fee-structure-select";
import { StudentMultiPicker } from "./student-multi-picker";

const EMPTY_SCOPE: Omit<BulkAssignScope, "mode" | "yearId"> = {
	structureId: "",
	classId: "",
	programId: "",
	studentIds: [],
};

export const BulkAssignDialog = createCallable<
	{
		onDone: () => void;
	},
	void
>(({ call, onDone }) => {
	const { t } = useTranslation();
	const [scope, setScope] = useState<BulkAssignScope>({
		mode: "class",
		yearId: "",
		...EMPTY_SCOPE,
	});
	const [studentSearch, setStudentSearch] = useState("");
	const [showPreview, setShowPreview] = useState(false);

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));
	const {
		canPreview,
		preview,
		isLoading: previewLoading,
	} = useBulkAssignPreview(scope, showPreview);
	const mut = useBulkAssign(scope, () => {
		onDone();
		call.end();
	});

	/** Changes part of the scope and hides the now outdated preview. */
	const updateScope = (patch: Partial<BulkAssignScope>) => {
		setScope((current) => ({ ...current, ...patch }));
		setShowPreview(false);
	};

	/** Clears everything but the mode and the year. */
	const reset = (patch: Partial<BulkAssignScope>) => {
		updateScope({ ...EMPTY_SCOPE, ...patch });
		setStudentSearch("");
	};

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("feeClearance.assignments.bulkAssign")}</DialogTitle>
				</DialogHeader>

				<DialogBody className="space-y-4">
					{/* Mode selector */}
					<div>
						<Label>{t("feeClearance.bulkAssign.mode")}</Label>
						<Select
							value={scope.mode}
							onValueChange={(v) => reset({ mode: v as BulkMode })}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="class">
									{t("feeClearance.bulkAssign.modeClass")}
								</SelectItem>
								<SelectItem value="program">
									{t("feeClearance.bulkAssign.modeProgram")}
								</SelectItem>
								<SelectItem value="year">
									{t("feeClearance.bulkAssign.modeYear")}
								</SelectItem>
								<SelectItem value="students">
									{t("feeClearance.assignments.bulkAssignModeStudents")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Year selector (all modes except students) */}
					{scope.mode !== "students" && (
						<div>
							<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
							<AcademicYearSelect
								value={scope.yearId || null}
								onChange={(v) => reset({ yearId: v })}
								autoSelectActive
							/>
						</div>
					)}

					{/* Mode-specific scope selector */}
					{scope.mode === "class" && (
						<div>
							<Label>{t("admin.classes.title")}</Label>
							<ClassSelect
								academicYearId={scope.yearId || null}
								value={scope.classId || null}
								onChange={(v) => updateScope({ classId: v ?? "" })}
								disabled={!scope.yearId}
							/>
						</div>
					)}
					{scope.mode === "program" && (
						<div>
							<Label>{t("feeClearance.bulkAssign.program")}</Label>
							<Select
								value={scope.programId}
								onValueChange={(v) => updateScope({ programId: v })}
							>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{programs?.items?.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{scope.mode === "students" && (
						<StudentMultiPicker
							search={studentSearch}
							onSearchChange={(value) => {
								setStudentSearch(value);
								setShowPreview(false);
							}}
							selectedIds={scope.studentIds}
							onSelectedIdsChange={(update) =>
								updateScope({ studentIds: update(scope.studentIds) })
							}
						/>
					)}

					<FeeStructureSelect
						academicYearId={scope.yearId}
						value={scope.structureId}
						onChange={(v) => updateScope({ structureId: v })}
						triggerClassName="mt-1"
					/>

					{/* Preview panel */}
					{showPreview && (
						<div className="rounded-lg border bg-muted/30 p-3">
							{previewLoading ? (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Loader2 className="h-4 w-4 animate-spin" />
									{t("feeClearance.bulkAssign.computing")}
								</div>
							) : preview ? (
								<BulkAssignPreviewPanel preview={preview} />
							) : null}
						</div>
					)}
				</DialogBody>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					{!showPreview ? (
						<Button disabled={!canPreview} onClick={() => setShowPreview(true)}>
							{t("feeClearance.bulkAssign.preview")}
						</Button>
					) : (
						<Button
							disabled={
								mut.isPending ||
								previewLoading ||
								!preview ||
								preview.toAssign.length === 0
							}
							onClick={() => mut.mutate()}
						>
							{mut.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("feeClearance.bulkAssign.confirm", {
								count: preview?.toAssign.length ?? 0,
							})}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
