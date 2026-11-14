import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
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
 * `onDone` is called once the deliberation(s) are created.
 */
export function useCreateDeliberation(onDone: () => void) {
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

	function close() {
		reset();
		onDone();
	}

	function buildInput(classId: string) {
		return {
			classId,
			academicYearId: fields.academicYearId!,
			type: fields.type as DeliberationType,
			semesterId: fields.semesterId || undefined,
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
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["deliberations"] });
			close();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const initAndComputeMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.initAndCompute.mutate(
				buildInput(singleClassId!),
			),
		onSuccess: () => {
			toast.success(
				t("admin.deliberations.toast.initAndComputeSuccess", {
					defaultValue: "Délibération créée et résultats calculés",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["deliberations"] });
			close();
		},
		onError: (err) => toast.error((err as Error).message),
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
		if (!selectedClassIds.length || !fields.academicYearId || !fields.type)
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

		queryClient.invalidateQueries({ queryKey: ["deliberations"] });

		if (errors.length === 0) {
			toast.success(
				t("admin.deliberations.toast.batchCreateSuccess", {
					defaultValue: `${selectedClassIds.length} délibération(s) créée(s)`,
				}),
			);
			close();
		} else {
			toast.error(
				t("admin.deliberations.toast.batchCreatePartial", {
					defaultValue: `${selectedClassIds.length - errors.length} créée(s), ${errors.length} erreur(s)`,
				}),
			);
		}
	}

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
		singleCanSubmit:
			!!singleClassId && !!fields.academicYearId && !!fields.type,
		multiCanSubmit:
			!!selectedClassIds.length && !!fields.academicYearId && !!fields.type,
		singlePending: createMutation.isPending || initAndComputeMutation.isPending,
		batchRunning: !!batchProgress && batchProgress.done < batchProgress.total,
	};
}

export type CreateDeliberationState = ReturnType<typeof useCreateDeliberation>;
