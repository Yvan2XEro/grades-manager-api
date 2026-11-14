import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { ClassFormDialog } from "@/modules/classes/components/class-form-dialog";
import { trpc, trpcClient } from "@/utils/trpc";
import type { DocumentReviewStatus, ReviewStatus } from "../types";

/**
 * One application under review: its detail, document checklist and the class
 * options of its program and year, plus the decision form state and the
 * review / document / conversion mutations. Shared by the review drawer and
 * the full application page.
 */
export function useApplicationReview(id: string | null | undefined) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [decisionNotes, setDecisionNotes] = useState("");
	const [registrationNumber, setRegistrationNumber] = useState("");
	const [targetClassId, setTargetClassId] = useState("");

	const detailQuery = useQuery(
		trpc.admissions.get.queryOptions({ id: id ?? "" }, { enabled: !!id }),
	);
	const checklistQuery = useQuery(
		trpc.admissions.getChecklist.queryOptions(
			{ applicationId: id ?? "" },
			{ enabled: !!id },
		),
	);
	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());

	const app = detailQuery.data;
	const programs = optionsQuery.data?.programs ?? [];
	const classes = (optionsQuery.data?.classes ?? []).filter((k) =>
		app
			? k.program === app.programId && k.academicYear === app.academicYearId
			: true,
	);

	// Creates the missing class of the application's program and year in place,
	// inserts it into the options cache feeding the select, then selects it.
	const createClass = async () => {
		if (!app) return;
		const { programId, academicYearId } = app as {
			programId: string;
			academicYearId: string;
		};
		const created = await ClassFormDialog.call({
			defaults: { programId, academicYearId },
			lockAcademicYear: true,
		});
		if (!created) return;
		queryClient.setQueryData(trpc.admissions.publicOptions.queryKey(), (old) =>
			old ? { ...old, classes: upsertInList(old.classes, created) } : old,
		);
		setTargetClassId(created.id);
	};

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.list.queryKey(),
		});
		if (!id) return;
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.get.queryKey({ id }),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.admissions.getChecklist.queryKey({ applicationId: id }),
		});
	};

	const setUnderReview = useMutation({
		mutationFn: () =>
			trpcClient.admissions.setUnderReview.mutate({ id: id ?? "" }),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.updated"));
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const review = useMutation({
		mutationFn: (status: ReviewStatus) =>
			trpcClient.admissions.review.mutate({
				id: id ?? "",
				status,
				reviewNotes: decisionNotes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.reviewed"));
			setDecisionNotes("");
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const reviewDocument = useMutation({
		mutationFn: (input: { id: string; status: DocumentReviewStatus }) =>
			trpcClient.admissions.reviewDocument.mutate(input),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.documentReviewed"));
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const convert = useMutation({
		mutationFn: () =>
			trpcClient.admissions.convert.mutate({
				id: id ?? "",
				classId: targetClassId || undefined,
				registrationNumber: registrationNumber.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(t("admissions.admin.toasts.converted"));
			setRegistrationNumber("");
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return {
		app,
		isLoading: detailQuery.isLoading,
		checklist: checklistQuery.data,
		checklistLoading: checklistQuery.isLoading,
		programs,
		classes,
		decisionNotes,
		setDecisionNotes,
		registrationNumber,
		setRegistrationNumber,
		targetClassId,
		setTargetClassId,
		createClass,
		setUnderReview,
		review,
		reviewDocument,
		convert,
	};
}

export type ApplicationReview = ReturnType<typeof useApplicationReview>;
