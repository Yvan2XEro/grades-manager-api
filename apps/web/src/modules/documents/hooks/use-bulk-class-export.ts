import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import {
	type BulkExportClass,
	type BulkExportFormat,
	type BulkExportMode,
	type BulkExportStatus,
	type ClassExport,
	saveClassExports,
} from "../services/bulk-class-export";

/** Selection, per-class status and the sequential export of `BulkClassExportDialog`. */
export function useBulkClassExport(classes: BulkExportClass[]) {
	const [format, setFormat] = useState<BulkExportFormat>("xlsx");
	const [mode, setMode] = useState<BulkExportMode>("unified");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		() => new Set(classes.map((c) => c.id)),
	);
	const [status, setStatus] = useState<Record<string, BulkExportStatus>>({});
	const [progress, setProgress] = useState({ done: 0, total: 0 });
	const [isRunning, setIsRunning] = useState(false);

	// "Unique" only makes sense for Excel (multi-sheets workbook). PDF unique
	// would require pdf-lib for merging; we fall back to "separated".
	useEffect(() => {
		if (format === "pdf" && mode === "unified") setMode("separated");
	}, [format, mode]);

	const allSelected = classes.length > 0 && selectedIds.size === classes.length;
	const toggleAll = () =>
		setSelectedIds(allSelected ? new Set() : new Set(classes.map((c) => c.id)));
	const toggleOne = (id: string) =>
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const summary = useMemo(() => {
		const list = Object.values(status);
		return {
			ok: list.filter((s) => s.state === "ok").length,
			error: list.filter((s) => s.state === "error").length,
			running: list.filter((s) => s.state === "running").length,
		};
	}, [status]);

	const exportMutation = useMutation({
		mutationFn: async () => {
			const ids = [...selectedIds];
			if (ids.length === 0) throw new Error("Aucune classe sélectionnée");

			setIsRunning(true);
			setProgress({ done: 0, total: ids.length });
			const initial: Record<string, BulkExportStatus> = {};
			ids.forEach((id) => {
				initial[id] = { state: "pending" };
			});
			setStatus(initial);

			const institution = await trpcClient.institutions.get.query();

			// Fetch each class's students sequentially. We could parallelize
			// student fetches (cheap), but the bottleneck is Puppeteer for the
			// PDF path — so we keep it serial across the board for simplicity
			// and predictable status updates.
			const results: ClassExport[] = [];

			for (let i = 0; i < ids.length; i++) {
				const id = ids[i];
				const cls = classes.find((c) => c.id === id);
				if (!cls) continue;
				setStatus((s) => ({ ...s, [id]: { state: "running" } }));
				try {
					const studentsRes = await trpcClient.students.list.query({
						classId: id,
						limit: 1000,
					});
					const students = (studentsRes as { items: ClassExport["students"] })
						.items;

					if (format === "pdf") {
						const pdfRes =
							await trpcClient.academicDocuments.generateStudentList.mutate({
								classId: id,
								format: "pdf",
								demoMode: false,
							});
						const pdf = pdfRes as {
							data: string;
							filename: string;
							mimeType: string;
						};
						results.push({
							cls,
							students,
							pdfBase64: pdf.data,
							pdfFilename: pdf.filename,
						});
					} else {
						results.push({ cls, students });
					}

					setStatus((s) => ({ ...s, [id]: { state: "ok" } }));
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					setStatus((s) => ({ ...s, [id]: { state: "error", error: msg } }));
				} finally {
					setProgress({ done: i + 1, total: ids.length });
				}
			}

			const institutionName =
				(institution as { nameFr?: string; nameEn?: string })?.nameFr ??
				"Institution";
			await saveClassExports(results, format, mode, institutionName);

			return {
				ok: results.length,
				total: ids.length,
			};
		},
		onSuccess: (r) => {
			toast.success(`${r.ok} / ${r.total} liste(s) exportée(s)`);
			setIsRunning(false);
		},
		onError: (err: any) => {
			toast.error(err?.message ?? "Échec de l'export");
			setIsRunning(false);
		},
	});

	return {
		format,
		setFormat,
		mode,
		setMode,
		selectedIds,
		allSelected,
		toggleAll,
		toggleOne,
		status,
		progress,
		isRunning,
		summary,
		exportMutation,
	};
}
