import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramList } from "./use-programs";

const buildUnitSchema = (
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	z.object({
		name: z.string().min(
			2,
			t("admin.teachingUnits.validation.name", {
				defaultValue: "Name is required",
			}),
		),
		code: z.string().min(
			2,
			t("admin.teachingUnits.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		description: z.string().optional(),
		credits: z.number().nonnegative(
			t("admin.teachingUnits.validation.credits", {
				defaultValue: "Credits must be positive",
			}),
		),
		semester: z.enum(["fall", "spring", "annual"]),
		programId: z.string({
			required_error: t("admin.teachingUnits.validation.program", {
				defaultValue: "Select a program",
			}),
		}),
	});

export type TeachingUnitFormData = z.infer<ReturnType<typeof buildUnitSchema>>;

const defaultValues: TeachingUnitFormData = {
	name: "",
	code: "",
	description: "",
	credits: 0,
	semester: "annual",
	programId: "",
};

/**
 * Form of the teaching unit detail page: creates the unit when
 * `teachingUnitId` is `"new"` (then opens it), updates it otherwise.
 */
export function useTeachingUnitForm(teachingUnitId: string) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const isCreateMode = teachingUnitId === "new";

	const unitSchema = useMemo(() => buildUnitSchema(t), [t]);
	const programs = useProgramList();

	const { data: teachingUnit } = useQuery({
		...trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId }),
		enabled: !isCreateMode,
	});

	const form = useForm<TeachingUnitFormData>({
		resolver: zodResolver(unitSchema),
		defaultValues,
	});

	useEffect(() => {
		if (teachingUnit) {
			form.reset({
				name: teachingUnit.name,
				code: teachingUnit.code,
				description: teachingUnit.description ?? "",
				credits: teachingUnit.credits,
				semester: teachingUnit.semester,
				programId: teachingUnit.programId,
			});
		}
	}, [teachingUnit, form]);

	const invalidateLists = () => {
		queryClient.invalidateQueries(trpc.teachingUnits.list.queryKey({}));
		if (!isCreateMode) {
			queryClient.invalidateQueries(
				trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId }),
			);
		}
	};

	const createMutation = useMutation({
		mutationFn: (payload: TeachingUnitFormData) =>
			trpcClient.teachingUnits.create.mutate(payload),
		onSuccess: (unit) => {
			toast.success(
				t("admin.teachingUnits.toast.created", {
					defaultValue: "Teaching unit created",
				}),
			);
			invalidateLists();
			navigate(`/programs/teaching-units/${unit.id}/details`);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: (payload: TeachingUnitFormData) =>
			trpcClient.teachingUnits.update.mutate({
				id: teachingUnitId,
				...payload,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.toast.updated", {
					defaultValue: "Teaching unit updated",
				}),
			);
			invalidateLists();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const onSubmit = (values: TeachingUnitFormData) =>
		isCreateMode
			? createMutation.mutate(values)
			: updateMutation.mutate(values);

	return {
		form,
		programs,
		isCreateMode,
		isPending:
			form.formState.isSubmitting ||
			createMutation.isPending ||
			updateMutation.isPending,
		onSubmit,
	};
}

export type TeachingUnitFormController = ReturnType<typeof useTeachingUnitForm>;
