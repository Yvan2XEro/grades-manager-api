import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import type { StudyCycle } from "../types";

export const studyCycleSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	nameEn: z.string().optional(),
	description: z.string().optional(),
	totalCreditsRequired: z.coerce.number().int().min(30),
	durationYears: z.coerce.number().int().min(1),
});

export type StudyCycleFormInput = z.input<typeof studyCycleSchema>;
export type StudyCycleFormData = z.output<typeof studyCycleSchema>;
export type StudyCycleForm = UseFormReturn<
	StudyCycleFormInput,
	unknown,
	StudyCycleFormData
>;

export const studyCycleDefaultValues: StudyCycleFormInput = {
	code: "",
	name: "",
	nameEn: "",
	description: "",
	totalCreditsRequired: 180,
	durationYears: 3,
};

export const studyCycleToFormValues = (
	cycle: StudyCycle,
): StudyCycleFormInput => ({
	code: cycle.code,
	name: cycle.name,
	nameEn: cycle.nameEn ?? "",
	description: cycle.description ?? "",
	totalCreditsRequired: cycle.totalCreditsRequired,
	durationYears: cycle.durationYears,
});

/** Form state of a study cycle, shared by the create/edit dialog and the details tab. */
export function useStudyCycleForm(cycle?: StudyCycle | null) {
	const form: StudyCycleForm = useForm<
		StudyCycleFormInput,
		unknown,
		StudyCycleFormData
	>({
		resolver: zodResolver(studyCycleSchema),
		defaultValues: cycle
			? studyCycleToFormValues(cycle)
			: studyCycleDefaultValues,
	});

	const code = form.watch("code");
	const duration = Number(form.watch("durationYears"));
	const credits = Number(form.watch("totalCreditsRequired"));

	/** Levels the server creates along with a new cycle (one per year). */
	const autoLevelsPreview = useMemo(() => {
		if (!duration || duration < 1 || duration > 20) return [];
		return Array.from({ length: duration }, (_, i) => ({
			code: code ? `${code}-L${i + 1}` : `L${i + 1}`,
			name: `Level ${i + 1}`,
			minCredits: credits ? Math.floor(credits / duration) : 0,
		}));
	}, [code, duration, credits]);

	return { form, autoLevelsPreview };
}
