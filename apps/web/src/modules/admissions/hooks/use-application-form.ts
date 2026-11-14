import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	clearDraft,
	readDraft,
	saveDraft,
} from "../services/application-draft";
import { toSubmitApplicationInput } from "../services/application-payload";
import {
	DEFAULT_VALUES,
	type FieldName,
	STEP_FIELDS,
	TOTAL_STEPS,
	type WizardValues,
	wizardSchema,
} from "../services/application-schema";

/**
 * State of the public application wizard: the form, its local draft (auto-saved
 * on every change), the current step with per-step validation, the certify
 * checkbox and the submission.
 */
export function useApplicationForm() {
	// Lazy init: detect draft synchronously to prevent the first auto-save
	// from overwriting it before the user decides whether to restore.
	const [hasDraft, setHasDraft] = useState(() => readDraft() !== null);
	const [step, setStep] = useState(1);
	const [certify, setCertify] = useState(false);
	const [certifyError, setCertifyError] = useState(false);
	const [submittedReference, setSubmittedReference] = useState<string | null>(
		null,
	);
	const contentRef = useRef<HTMLDivElement>(null);

	const form = useForm<WizardValues>({
		resolver: zodResolver(wizardSchema),
		defaultValues: DEFAULT_VALUES,
		mode: "onTouched",
	});

	// Auto-save on every field change (subscribe, not watch in render)
	useEffect(() => {
		const { unsubscribe } = form.watch((values) => {
			if (hasDraft) return;
			saveDraft({ step, form: values });
		});
		return unsubscribe;
	}, [form, step, hasDraft]);

	const resumeDraft = () => {
		const draft = readDraft();
		if (!draft) return;
		form.reset(draft.form);
		setStep(draft.step);
		setHasDraft(false);
	};

	const discardDraft = () => {
		clearDraft();
		setHasDraft(false);
	};

	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());
	const programs = optionsQuery.data?.programs ?? [];
	const academicYears = optionsQuery.data?.academicYears ?? [];

	const submitMutation = useMutation({
		mutationFn: (values: WizardValues) =>
			trpcClient.admissions.submit.mutate(toSubmitApplicationInput(values)),
		onSuccess: (result) => {
			clearDraft();
			setSubmittedReference(result.referenceCode);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const scrollToTop = () =>
		contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

	const goNext = async () => {
		let fields = STEP_FIELDS[step] ?? [];
		// Step 4: only validate prior fields when toggle is on
		if (step === 4 && form.getValues("hasPriorHigherEd")) {
			fields = ["priorInstitution", "priorField", "priorLevel"] as FieldName[];
		}
		const valid = fields.length === 0 || (await form.trigger(fields));
		if (!valid) {
			scrollToTop();
			return;
		}
		setStep((s) => Math.min(s + 1, TOTAL_STEPS));
		scrollToTop();
	};

	const goBack = () => {
		setStep((s) => Math.max(s - 1, 1));
		scrollToTop();
	};

	const goToStep = (n: number) => {
		setStep(n);
		scrollToTop();
	};

	const handleSubmit = form.handleSubmit((values) => {
		if (!certify) {
			setCertifyError(true);
			return;
		}
		setCertifyError(false);
		submitMutation.mutate(values);
	});

	return {
		form,
		step,
		hasDraft,
		resumeDraft,
		discardDraft,
		programs,
		academicYears,
		certify,
		setCertify,
		certifyError,
		submittedReference,
		isSubmitting: submitMutation.isPending,
		contentRef,
		goNext,
		goBack,
		goToStep,
		handleSubmit,
	};
}
