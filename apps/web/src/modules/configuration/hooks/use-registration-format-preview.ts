import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { DraftFormat, PreviewProfile } from "../types";

/** Generates a sample registration number of the draft for a class and student. */
export function useRegistrationFormatPreview(draft: DraftFormat) {
	const { t } = useTranslation();
	const [classId, setClassId] = useState("");
	const [profile, setProfile] = useState<PreviewProfile>({
		firstName: "",
		lastName: "",
		nationality: "",
	});
	const [result, setResult] = useState("");

	const classesQuery = useQuery(trpc.classes.list.queryOptions({ limit: 100 }));
	const classOptions = useMemo(
		() => classesQuery.data?.items ?? [],
		[classesQuery.data],
	);

	useEffect(() => {
		if (!classId && classOptions.length) {
			setClassId(classOptions[0].id);
		}
	}, [classOptions, classId]);

	const previewMutation = useMutation({
		mutationFn: async () => {
			if (!classId) {
				throw new Error(
					t("admin.registrationNumbers.errors.previewClass", {
						defaultValue: "Select a class to preview",
					}),
				);
			}
			const response = await trpcClient.registrationNumbers.preview.mutate({
				classId,
				formatId: draft.id,
				definition: draft.definition,
				profile: {
					firstName: profile.firstName || undefined,
					lastName: profile.lastName || undefined,
					nationality: profile.nationality || undefined,
				},
			});
			return response.preview;
		},
		onSuccess: (preview) => setResult(preview),
		onError: (error) => toast.error(error.message),
	});

	return {
		classId,
		setClassId,
		classOptions,
		profile,
		setProfileField: (key: keyof PreviewProfile, value: string) =>
			setProfile((prev) => ({ ...prev, [key]: value })),
		result,
		run: () => previewMutation.mutate(),
		isRunning: previewMutation.isPending,
	};
}
