import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { deliberationErrorMessage } from "../services/deliberation-errors";
import type { DeliberationType } from "../services/deliberation-status";

export type CreateDeliberationTab = "single" | "multi";

export interface SharedFields {
	academicYearId: string | null;
	type: string;
	semesterId: string | null;
	deliberationDate: string;
	juryNumber: string;
	quickStart: boolean;
}

export interface BatchProgress {
	done: number;
	total: number;
	errors: string[];
}

/** What was created, so the caller can show it. */
export interface CreatedDeliberation {
	academicYearId: string;
	/** Set when a single deliberation was created. */
	deliberationId?: string;
}

const initialFields: SharedFields = {
	academicYearId: null,
	type: "",
	semesterId: null,
	deliberationDate: "",
	juryNumber: "",
	quickStart: false,
};

/**
 * State of the create-deliberation dialog: shared fields, the single class or
 * the selected classes, and the create / init-and-compute / batch actions.
 * `onDone` is called when the dialog closes, with what was created (if any).
 */
export function useCreateDeliberation(
	onDone: (created?: CreatedDeliberation) => void,
) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [tab, setTab] = useState<CreateDeliberationTab>("single");
	const [fields, setFields] = useState<SharedFields>(initialFields);
	const [singleClassId, setSingleClassId] = useState<string | null>(null);
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
		null,
	);

	function patch(p: Partial<SharedFields>) {
		setFields((prev) => ({ ...prev, ...p }));
	}

	function setAcademicYear(academicYearId: string | null) {
		patch({ academicYearId });
		setSingleClassId(null);
		setSelectedClassIds([]);
	}

	function reset() {
		setFields(initialFields);
		setSingleClassId(null);
		setSelectedClassIds([]);
		setBatchProgress(null);
		setTab("single");
	}

	function close(created?: CreatedDeliberation) {
		reset();
		onDone(created);
	}

	const createdSingle = (deliberationId: string): CreatedDeliberation => ({
		academicYearId: fields.academicYearId!,
		deliberationId,
	});

	/** A jury on a class without students computes nothing: say so. */
	const warnIfNoStudents = (studentCount: number) => {
		if (studentCount === 0) {
			toast.warning(t("admin.deliberations.toast.noStudents"));
		}
	};

	function buildInput(classId: string) {
		return {
			classId,
			academicYearId: fields.academicYearId!,
			type: fields.type as DeliberationType,
			semesterId:
				fields.type === "semester" ? fields.semesterId || undefined : undefined,
			deliberationDate: fields.deliberationDate
				? new Date(fields.deliberationDate).toISOString()
				: undefined,
			juryNumber: fields.juryNumber || undefined,
		};
	}

	// ── Single class ──────────────────────────────────────────────────────────
	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.create.mutate(buildInput(singleClassId!)),
		onSuccess: (created) => {
			toast.success(t("admin.deliberations.toast.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: trpc.deliberations.listPaged.queryKey(),
			});
			close(createdSingle(created.id));
		},
		onError: (err) => toast.error(deliberationErrorMessage(t, err)),
	});

	const initAndComputeMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.initAndCompute.mutate(
				buildInput(singleClassId!),
			),
		onSuccess: (created) => {
			const studentCount = created.studentResults?.length ?? 0;
			if (studentCount === 0) warnIfNoStudents(0);
			else toast.success(t("admin.deliberations.toast.initAndComputeSuccess"));
			queryClient.invalidateQueries({
				queryKey: trpc.deliberations.listPaged.queryKey(),
			});
			close(createdSingle(created.id));
		},
		onError: (err) => toast.error(deliberationErrorMessage(t, err)),
	});

	const submitSingle = () =>
		fields.quickStart
			? initAndComputeMutation.mutate()
			: createMutation.mutate();

	// ── Multi-class ───────────────────────────────────────────────────────────
	const classesQuery = useQuery({
		queryKey: ["class-select", fields.academicYearId ?? "all"],
		enabled: !!fields.academicYearId,
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({
				academicYearId: fields.academicYearId!,
				limit: 200,
			});
			return items;
		},
	});
	const allClasses = classesQuery.data ?? [];

	function toggleClass(id: string) {
		setSelectedClassIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	function toggleAll() {
		setSelectedClassIds(
			selectedClassIds.length === allClasses.length
				? []
				: allClasses.map((c) => c.id),
		);
	}

	async function submitBatch() {
		if (!selectedClassIds.length || !fieldsComplete || !fields.academicYearId)
			return;
		const errors: string[] = [];
		setBatchProgress({ done: 0, total: selectedClassIds.length, errors: [] });

		const fn = fields.quickStart
			? trpcClient.deliberations.initAndCompute.mutate
			: trpcClient.deliberations.create.mutate;

		for (let i = 0; i < selectedClassIds.length; i++) {
			try {
				await fn(buildInput(selectedClassIds[i]));
			} catch {
				const name =
					allClasses.find((c) => c.id === selectedClassIds[i])?.name ??
					selectedClassIds[i];
				errors.push(name);
			}
			setBatchProgress({
				done: i + 1,
				total: selectedClassIds.length,
				errors: [...errors],
			});
		}

		queryClient.invalidateQueries({
			queryKey: trpc.deliberations.listPaged.queryKey(),
		});

		if (errors.length === 0) {
			toast.success(
				t("admin.deliberations.toast.batchCreatedCount", {
					count: selectedClassIds.length,
				}),
			);
			close({ academicYearId: fields.academicYearId });
		} else {
			toast.error(
				t("admin.deliberations.toast.batchCreatedPartial", {
					created: selectedClassIds.length - errors.length,
					count: errors.length,
				}),
			);
		}
	}

	// A semester jury needs its semester
	const fieldsComplete =
		!!fields.academicYearId &&
		!!fields.type &&
		(fields.type !== "semester" || !!fields.semesterId);

	return {
		tab,
		setTab,
		fields,
		patch,
		setAcademicYear,
		singleClassId,
		setSingleClassId,
		selectedClassIds,
		toggleClass,
		toggleAll,
		classesQuery,
		allClasses,
		batchProgress,
		close,
		submitSingle,
		submitBatch,
		singleCanSubmit: !!singleClassId && fieldsComplete,
		multiCanSubmit: !!selectedClassIds.length && fieldsComplete,
		singlePending: createMutation.isPending || initAndComputeMutation.isPending,
		batchRunning: !!batchProgress && batchProgress.done < batchProgress.total,
	};
}

export type CreateDeliberationState = ReturnType<typeof useCreateDeliberation>;
