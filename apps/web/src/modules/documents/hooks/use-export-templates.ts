import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { downloadBase64, fileDateStamp } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ExportTemplateType } from "../types";

/** Paged export templates, optionally filtered by type ("all" = no filter). */
export function useExportTemplates({
	page,
	pageSize,
	selectedType,
}: {
	page: number;
	pageSize: number;
	selectedType: string;
}) {
	const { data, isLoading } = useQuery(
		trpc.exportTemplates.listPaged.queryOptions({
			page,
			pageSize,
			type:
				selectedType === "all"
					? undefined
					: (selectedType as ExportTemplateType),
		}),
	);
	return { data, templates: data?.items ?? [], isLoading };
}

/** Delete / set default / bulk delete of export templates. */
export function useExportTemplateMutations() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exportTemplates.delete.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.deleteSuccess"));
			queryClient.invalidateQueries(trpc.exportTemplates.listPaged.queryKey());
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.deleteError"),
			);
		},
	});

	// Set default mutation
	const setDefaultMutation = useMutation({
		mutationFn: async ({ id, type }: { id: string; type: string }) => {
			await trpcClient.exportTemplates.setDefault.mutate({
				id,
				type: type as any,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.setDefaultSuccess"));
			queryClient.invalidateQueries(trpc.exportTemplates.listPaged.queryKey());
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.setDefaultError"),
			);
		},
	});

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.exportTemplates.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.exportTemplates.listPaged.queryKey());
			toast.success(t("common.bulkActions.deleteSuccess"));
		},
		onError: () => toast.error(t("common.bulkActions.deleteError")),
	});

	return { deleteMutation, setDefaultMutation, bulkDeleteMutation };
}

/** Seeds the official templates and downloads a ZIP of every bundled template rendered as PDF. */
export function useSystemTemplates() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// Seed system defaults mutation (idempotent)
	const seedSystemMutation = useMutation({
		mutationFn: async () => {
			return await trpcClient.academicDocuments.seedSystemDefaults.mutate();
		},
		onSuccess: (result: {
			created: string[];
			skipped: string[];
			failed?: Array<{ type: string; reason: string }>;
			linkedAssignments?: number;
			assignmentFailures?: Array<{
				programCode?: string;
				templateType: string;
				reason: string;
			}>;
		}) => {
			queryClient.invalidateQueries(trpc.exportTemplates.listPaged.queryKey());
			const failed = result.failed ?? [];
			if (failed.length > 0) {
				toast.error(
					t("admin.exportTemplates.system.seedFailed", {
						count: failed.length,
						details: failed.map((f) => `${f.type} → ${f.reason}`).join(" ; "),
					}),
				);
			}
			if (result.created.length > 0) {
				toast.success(
					t("admin.exportTemplates.system.seedCreated", {
						created: result.created.join(", "),
					}),
				);
			} else if (failed.length === 0) {
				toast.info(t("admin.exportTemplates.system.seedAllPresent"));
			}
			// Auto-link feedback: show how many program×type assignments were
			// (re)written so the admin sees the linking step ran.
			const linked = result.linkedAssignments ?? 0;
			const linkFails = result.assignmentFailures ?? [];
			if (linked > 0) {
				toast.success(
					t("admin.exportTemplates.system.linked", { count: linked }),
				);
			}
			if (linkFails.length > 0) {
				toast.warning(
					t("admin.exportTemplates.system.linkFailed", {
						count: linkFails.length,
						details: `${linkFails
							.slice(0, 3)
							.map((f) => `${f.programCode ?? "?"}/${f.templateType}`)
							.join(", ")}${linkFails.length > 3 ? "…" : ""}`,
					}),
				);
			}
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.exportTemplates.system.seedError"));
		},
	});

	// Render every bundled template (8 kinds × 2 variants) as PDF, return ZIP.
	// Uses the active institution + center metadata + sample student data so the
	// admin can review the look of each model without seeding fake students.
	const exportAllMutation = useMutation({
		mutationFn: async () => {
			return await trpcClient.exports.exportAllSampleTemplates.mutate();
		},
		onSuccess: (result: {
			zipBase64: string;
			count: number;
			failures: Array<{ kind: string; variant: string; error: string }>;
		}) => {
			downloadBase64(
				result.zipBase64,
				`${t("admin.exportTemplates.system.zipName")}-${fileDateStamp()}.zip`,
				"application/zip",
			);
			if (result.failures.length > 0) {
				toast.warning(
					t("admin.exportTemplates.system.exportPartial", {
						count: result.count,
						failed: result.failures.length,
						details: result.failures
							.map((f) => `${f.kind}/${f.variant}`)
							.join(", "),
					}),
				);
			} else {
				toast.success(
					t("admin.exportTemplates.system.exportSuccess", {
						count: result.count,
					}),
				);
			}
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.system.exportError"),
			);
		},
	});

	return { seedSystemMutation, exportAllMutation };
}
