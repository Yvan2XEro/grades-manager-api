import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { BulkMode } from "../types";

export interface BulkAssignScope {
	mode: BulkMode;
	yearId: string;
	structureId: string;
	classId: string;
	programId: string;
	studentIds: string[];
}

/** Whether the scope of the current mode is complete enough to preview. */
export const canPreviewBulkAssign = (scope: BulkAssignScope) =>
	!!scope.structureId &&
	(scope.mode === "class"
		? !!scope.classId
		: scope.mode === "program"
			? !!scope.programId
			: scope.mode === "students"
				? scope.studentIds.length > 0
				: !!scope.yearId);

/** Preview of the students a bulk assignment would reach (one query per mode). */
export function useBulkAssignPreview(
	scope: BulkAssignScope,
	showPreview: boolean,
) {
	const { mode, yearId, structureId, classId, programId, studentIds } = scope;
	const canPreview = canPreviewBulkAssign(scope);

	const previewClass = useQuery({
		...trpc.feeClearance.previewBulkAssign.queryOptions({
			classId,
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "class" && canPreview,
	});
	const previewProgram = useQuery({
		...trpc.feeClearance.previewBulkAssignProgram.queryOptions({
			programId,
			academicYearId: yearId,
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "program" && canPreview,
	});
	const previewYear = useQuery({
		...trpc.feeClearance.previewBulkAssignYear.queryOptions({
			academicYearId: yearId,
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "year" && canPreview,
	});
	const previewStudents = useQuery({
		...trpc.feeClearance.previewBulkAssignStudents.queryOptions({
			studentIds: studentIds.length > 0 ? studentIds : ["__placeholder__"],
			feeStructureId: structureId,
		}),
		enabled: showPreview && mode === "students" && canPreview,
	});

	const preview =
		mode === "class"
			? previewClass.data
			: mode === "program"
				? previewProgram.data
				: mode === "students"
					? previewStudents.data
					: previewYear.data;
	const isLoading =
		previewClass.isFetching ||
		previewProgram.isFetching ||
		previewYear.isFetching ||
		previewStudents.isFetching;

	return { canPreview, preview, isLoading };
}

/** Assigns the structure to every student of the scope, skipping existing ones. */
export function useBulkAssign(scope: BulkAssignScope, onSuccess: () => void) {
	const { t } = useTranslation();
	const { mode, yearId, structureId, classId, programId, studentIds } = scope;
	return useMutation({
		mutationFn: () => {
			if (mode === "class")
				return trpcClient.feeClearance.bulkAssignClass.mutate({
					classId,
					feeStructureId: structureId,
					skipExisting: true,
				});
			if (mode === "program")
				return trpcClient.feeClearance.bulkAssignProgram.mutate({
					programId,
					academicYearId: yearId,
					feeStructureId: structureId,
					skipExisting: true,
				});
			if (mode === "students")
				return trpcClient.feeClearance.bulkAssignStudents.mutate({
					studentIds,
					feeStructureId: structureId,
					skipExisting: true,
				});
			return trpcClient.feeClearance.bulkAssignYear.mutate({
				academicYearId: yearId,
				feeStructureId: structureId,
				skipExisting: true,
			});
		},
		onSuccess: (result) => {
			toast.success(
				t("feeClearance.assignments.bulkAssignSuccess", {
					assigned: result.assigned,
					skipped: result.skipped,
				}),
			);
			onSuccess();
		},
	});
}
