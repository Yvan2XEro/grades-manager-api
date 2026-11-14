import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { useStore } from "@/store";
import { trpcClient } from "@/utils/trpc";
import { MY_PROFILE_KEY, useMyProfile } from "./use-my-profile";

const normalizeDate = (value?: string | null) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().split("T")[0];
};

const buildProfileSchema = (t: TFunction) =>
	z.object({
		firstName: z.string().min(1, t("settings.profile.validation.firstName")),
		lastName: z.string().min(1, t("settings.profile.validation.lastName")),
		phone: z.string().optional(),
		dateOfBirth: z.string().optional(),
		placeOfBirth: z.string().optional(),
		gender: z.enum(["male", "female", "other", ""]).optional(),
		nationality: z.string().optional(),
	});

export type ProfileFormValues = z.infer<ReturnType<typeof buildProfileSchema>>;

/** Form of the user's own domain profile, filled once the profile loads. */
export function useProfileForm() {
	const { t } = useTranslation();
	const { user, setUser } = useStore();
	const queryClient = useQueryClient();
	const { profile, initials } = useMyProfile();

	const profileSchema = buildProfileSchema(t);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			phone: "",
			dateOfBirth: "",
			placeOfBirth: "",
			gender: "",
			nationality: "",
		},
	});

	// Fill the form once the profile loads (and after refetches, unless edited).
	// Done in an effect: resetting during render looped forever.
	const { reset } = form;
	useEffect(() => {
		if (!profile || form.formState.isDirty) return;
		reset({
			firstName: profile.firstName ?? "",
			lastName: profile.lastName ?? "",
			phone: profile.phone ?? "",
			dateOfBirth: normalizeDate(profile.dateOfBirth),
			placeOfBirth: profile.placeOfBirth ?? "",
			gender: profile.gender || "",
			nationality: profile.nationality ?? "",
		});
	}, [profile, reset, form]);

	const mutation = useMutation({
		mutationFn: async (values: ProfileFormValues) =>
			trpcClient.users.updateMyProfile.mutate({
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				phone: values.phone?.trim() || null,
				dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : null,
				placeOfBirth: values.placeOfBirth?.trim() || null,
				gender: values.gender || undefined,
				nationality: values.nationality?.trim() || null,
			}),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
			if (updated && user) {
				setUser({
					...user,
					firstName: updated.firstName ?? user.firstName,
					lastName: updated.lastName ?? user.lastName,
				});
			}
			toast.success(t("settings.profile.toast.success"));
		},
		onError: () => toast.error(t("settings.profile.toast.error")),
	});

	const submit = form.handleSubmit((values) => mutation.mutate(values));

	return { form, submit, isPending: mutation.isPending, profile, initials };
}
