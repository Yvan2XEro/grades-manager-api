import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { sortYearsRecentFirst } from "@/lib/academic-years";
import { documentErrorMessage } from "@/lib/document-errors";
import { fileDateStamp } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import {
	type GeneratedDocument,
	saveGeneratedDocuments,
} from "../services/bulk-document-download";

export type BulkDocumentKind =
	| "enrollment_certificate"
	| "diploma"
	| "transcript"
	| "attestation";

/** A student enrolled in the class, and whether the document may be issued. */
export type BulkStudent = {
	id: string;
	registrationNumber: string;
	profile: { firstName: string; lastName: string };
	eligible: boolean;
	reason: string | null;
	decision: string | null;
};

type GenStatus =
	| { state: "pending" }
	| { state: "running" }
	| { state: "ok"; filename: string; pdfBase64: string; templateName?: string }
	| { state: "error"; error: string };

/**
 * Filters, students of the chosen class, selection and the sequential
 * generation (+ HTML preview) of the bulk document generation page.
 */
export function useBulkDocumentGeneration() {
	const { t } = useTranslation();
	const [kind, setKind] = useState<BulkDocumentKind>("transcript");
	const [academicYearId, setAcademicYearId] = useState<string>("");
	const [classId, setClassId] = useState<string>("");
	const [demoMode, setDemoMode] = useState(false);
	const [zipDownload, setZipDownload] = useState(true);
	// Period only matters for transcripts. Defaults to annual; semester
	// switches the title to "RELEVÉ DE NOTES SEMESTRIEL" and (future) filters
	// data to the chosen semester.
	const [period, setPeriod] = useState<"semester" | "annual">("annual");
	const [semesterId, setSemesterId] = useState<string>("");

	const { data: semesters } = useQuery({
		queryKey: ["bulk-semesters"],
		queryFn: async () => {
			const res = await trpcClient.semesters.list.query();
			return res.items;
		},
		enabled: kind === "transcript" && period === "semester",
	});
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [genStatus, setGenStatus] = useState<Record<string, GenStatus>>({});
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState({ done: 0, total: 0 });
	const { data: academicYears } = useQuery({
		queryKey: ["bulk-academic-years"],
		queryFn: async () => {
			const res = await trpcClient.academicYears.list.query({ limit: 100 });
			return sortYearsRecentFirst(res.items) as Array<{
				id: string;
				name: string;
			}>;
		},
	});

	const { data: classes, isLoading: classesLoading } = useQuery({
		queryKey: ["bulk-classes", academicYearId],
		queryFn: async () => {
			const res = await trpcClient.classes.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 100,
			});
			return (
				res as {
					items: Array<{
						id: string;
						name: string;
						code: string;
						program?: { name?: string };
					}>;
				}
			).items;
		},
	});

	// Every student enrolled in the class (pending / withdrawn ones too), with
	// the server's verdict for the chosen kind: ineligible ones are shown with
	// the reason and cannot be selected.
	const { data: roster, isLoading: studentsLoading } = useQuery({
		queryKey: ["bulk-roster", kind, classId],
		queryFn: () =>
			trpcClient.academicDocuments.classRoster.query({ kind, classId }),
		enabled: !!classId,
	});
	const studentItems: BulkStudent[] = useMemo(
		() =>
			(roster ?? []).map((r) => ({
				id: r.studentId,
				registrationNumber: r.registrationNumber,
				profile: { firstName: r.firstName, lastName: r.lastName },
				eligible: r.eligible,
				reason: r.reason,
				decision: r.decision,
			})),
		[roster],
	);
	const eligibleItems = studentItems.filter((s) => s.eligible);

	useEffect(() => {
		setSelectedIds(
			new Set(studentItems.filter((s) => s.eligible).map((s) => s.id)),
		);
		setGenStatus({});
		setProgress({ done: 0, total: 0 });
	}, [studentItems]);

	const allSelected =
		eligibleItems.length > 0 && selectedIds.size === eligibleItems.length;
	const toggleAll = () =>
		setSelectedIds(
			allSelected ? new Set() : new Set(eligibleItems.map((s) => s.id)),
		);
	const toggleOne = (id: string) =>
		setSelectedIds((prev) => {
			if (!studentItems.find((s) => s.id === id)?.eligible) return prev;
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const generateOne = useMutation({
		mutationFn: async (studentId: string) => {
			const res = await trpcClient.academicDocuments.generate.mutate({
				kind,
				studentId,
				classId,
				format: "pdf",
				demoMode,
				period,
				...(period === "semester" && semesterId ? { semesterId } : {}),
			});
			return res as {
				data: string;
				filename: string;
				mimeType: string;
				usedTemplate?: { name: string };
			};
		},
	});

	// HTML preview for one student. Uses the same resolution chain as the
	// real batch generation, so what you see is what you'll get — minus the
	// PDF rasterization step.
	const previewOne = useMutation({
		mutationFn: async (studentId: string) => {
			const res = await trpcClient.academicDocuments.generate.mutate({
				kind,
				studentId,
				classId,
				format: "html",
				demoMode,
				period,
				...(period === "semester" && semesterId ? { semesterId } : {}),
			});
			return res as {
				data: string;
				filename: string;
				mimeType: string;
				usedTemplate?: { name: string };
			};
		},
		onSuccess: (res, studentId) => {
			const s = studentItems.find((x) => x.id === studentId);
			const studentName = s
				? `${s.profile.lastName ?? ""} ${s.profile.firstName ?? ""}`.trim()
				: studentId;
			const templateName = res.usedTemplate?.name;
			DocumentPreviewDialog.call({
				title: t("admin.documents.bulk.previewTitle", {
					kind: t(`admin.documents.kinds.${kind}.label`),
					student: studentName,
				}),
				description: templateName ? (
					<Trans
						i18nKey="admin.documents.bulk.templateUsed"
						values={{ name: templateName }}
						components={{ strong: <strong /> }}
					/>
				) : (
					t("admin.documents.bulk.previewDescription")
				),
				html: res.data,
				paper: true,
			});
		},
		onError: (err) => toast.error(documentErrorMessage(t, err)),
	});

	const handleGenerate = async () => {
		const ids = [...selectedIds];
		if (ids.length === 0) {
			toast.error(t("admin.documents.bulk.toast.noSelection"));
			return;
		}
		setIsGenerating(true);
		setProgress({ done: 0, total: ids.length });
		const initial: Record<string, GenStatus> = {};
		ids.forEach((id) => {
			initial[id] = { state: "pending" };
		});
		setGenStatus(initial);

		const results: GeneratedDocument[] = [];

		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			setGenStatus((s) => ({ ...s, [id]: { state: "running" } }));
			try {
				const r = await generateOne.mutateAsync(id);
				results.push({
					studentId: id,
					ok: true,
					filename: r.filename,
					pdfBase64: r.data,
				});
				setGenStatus((s) => ({
					...s,
					[id]: {
						state: "ok",
						filename: r.filename,
						pdfBase64: r.data,
						templateName: r.usedTemplate?.name,
					},
				}));
			} catch (err) {
				const msg = documentErrorMessage(t, err);
				results.push({ studentId: id, ok: false, error: msg });
				setGenStatus((s) => ({
					...s,
					[id]: { state: "error", error: msg },
				}));
			} finally {
				setProgress({ done: i + 1, total: ids.length });
			}
		}

		const okCount = results.filter((r) => r.ok).length;
		const failCount = results.length - okCount;

		try {
			await saveGeneratedDocuments(results, {
				zip: zipDownload,
				zipName: () => {
					const cls = classes?.find((c) => c.id === classId);
					return `${kind}_${cls?.code ?? "batch"}_${fileDateStamp()}.zip`;
				},
			});
		} catch (err) {
			toast.error(
				t("admin.documents.bulk.toast.zipError", {
					error: err instanceof Error ? err.message : String(err),
				}),
			);
		}

		setIsGenerating(false);
		if (failCount === 0) {
			toast.success(
				t("admin.documents.bulk.toast.generated", { count: okCount }),
			);
		} else {
			toast.warning(
				t("admin.documents.bulk.summary", { ok: okCount, error: failCount }),
			);
		}
	};

	const summary = useMemo(() => {
		const list = Object.values(genStatus);
		return {
			total: list.length,
			ok: list.filter((s) => s.state === "ok").length,
			error: list.filter((s) => s.state === "error").length,
			running: list.filter((s) => s.state === "running").length,
			pending: list.filter((s) => s.state === "pending").length,
		};
	}, [genStatus]);

	const previewFirst = () => {
		const first = [...selectedIds][0] ?? eligibleItems[0]?.id;
		if (!first) {
			toast.error(t("admin.documents.bulk.toast.noStudentToPreview"));
			return;
		}
		previewOne.mutate(first);
	};

	return {
		kind,
		setKind,
		academicYearId,
		setAcademicYearId,
		classId,
		setClassId,
		demoMode,
		setDemoMode,
		zipDownload,
		setZipDownload,
		period,
		setPeriod,
		semesterId,
		setSemesterId,
		semesters,
		academicYears,
		classes,
		classesLoading,
		studentItems,
		eligibleCount: eligibleItems.length,
		studentsLoading,
		selectedIds,
		allSelected,
		toggleAll,
		toggleOne,
		genStatus,
		isGenerating,
		progress,
		summary,
		previewOne,
		previewFirst,
		handleGenerate,
	};
}
