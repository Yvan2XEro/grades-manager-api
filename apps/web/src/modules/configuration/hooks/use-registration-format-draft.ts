import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import {
	createEmptyDraft,
	createSegment,
	moveSegment,
} from "../services/registration-format";
import type { DraftFormat, Segment } from "../types";
import {
	useDeleteRegistrationFormats,
	useInvalidateRegistrationFormats,
	useRegistrationFormats,
} from "./use-registration-formats";

/**
 * Draft of the format edited on the detail page (`formatId` "new" or "+"
 * creates one): its segments, save and delete.
 */
export function useRegistrationFormatDraft(formatId: string | undefined) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isCreateMode = !formatId || formatId === "+" || formatId === "new";
	const [draft, setDraft] = useState<DraftFormat>(createEmptyDraft());

	const formatsQuery = useRegistrationFormats({ enabled: !isCreateMode });
	const existingFormat = useMemo(
		() => formatsQuery.data?.find((item) => item.id === formatId),
		[formatsQuery.data, formatId],
	);

	useEffect(() => {
		if (!isCreateMode && existingFormat) {
			setDraft({
				id: existingFormat.id,
				name: existingFormat.name,
				description: existingFormat.description,
				isActive: existingFormat.isActive,
				definition: existingFormat.definition,
			});
		}
	}, [existingFormat, isCreateMode]);

	const update = (patch: Partial<DraftFormat>) =>
		setDraft((prev) => ({ ...prev, ...patch }));

	const updateSegments = (updater: (segments: Segment[]) => Segment[]) =>
		setDraft((prev) => ({
			...prev,
			definition: { segments: updater(prev.definition.segments) },
		}));

	const segments = {
		add: (kind: Segment["kind"]) =>
			updateSegments((list) => [...list, createSegment(kind)]),
		changeKind: (index: number, kind: Segment["kind"]) =>
			updateSegments((list) =>
				list.map((segment, idx) =>
					idx === index ? createSegment(kind) : segment,
				),
			),
		update: (index: number, segment: Segment) =>
			updateSegments((list) =>
				list.map((existing, idx) => (idx === index ? segment : existing)),
			),
		move: (index: number, direction: "up" | "down") =>
			updateSegments((list) => moveSegment(list, index, direction)),
		remove: (index: number) =>
			updateSegments((list) => list.filter((_, idx) => idx !== index)),
	};

	const invalidateList = useInvalidateRegistrationFormats();

	const upsertMutation = useMutation({
		mutationFn: async () => {
			if (!draft.name.trim()) {
				throw new Error(
					t("admin.registrationNumbers.errors.missingName", {
						defaultValue: "Name is required",
					}),
				);
			}
			if (!draft.definition.segments.length) {
				throw new Error(
					t("admin.registrationNumbers.errors.missingSegments", {
						defaultValue: "Add at least one segment",
					}),
				);
			}
			const payload = {
				name: draft.name.trim(),
				description: draft.description?.trim() ? draft.description : undefined,
				definition: draft.definition,
				isActive: draft.isActive,
			};
			if (draft.id) {
				return trpcClient.registrationNumbers.update.mutate({
					id: draft.id,
					...payload,
				});
			}
			return trpcClient.registrationNumbers.create.mutate(payload);
		},
		onSuccess: (result) => {
			toast.success(
				t("admin.registrationNumbers.toast.saved", {
					defaultValue: "Format saved",
				}),
			);
			invalidateList();
			if (!draft.id) {
				navigate(`/registration-numbers/${result.id}`, { replace: true });
			} else {
				update({ id: result.id });
			}
		},
		onError: (error) => toast.error(error.message),
	});

	const deleteFormats = useDeleteRegistrationFormats();
	const remove = () => {
		if (!draft.id) return;
		deleteFormats.mutate([draft.id], {
			onSuccess: () => navigate("/configuration/reg-numbers"),
		});
	};

	return {
		draft,
		update,
		segments,
		isCreateMode,
		isLoading: !isCreateMode && formatsQuery.isPending,
		notFound: !isCreateMode && !formatsQuery.isPending && !existingFormat,
		save: () => upsertMutation.mutate(),
		isSaving: upsertMutation.isPending,
		remove,
		isDeleting: deleteFormats.isPending,
	};
}
