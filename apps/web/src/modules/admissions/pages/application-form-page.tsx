import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import { ApplicationDraftPrompt } from "../components/application-draft-prompt";
import { ApplicationProgress } from "../components/application-progress";
import { ApplicationStepBac } from "../components/application-step-bac";
import { ApplicationStepContact } from "../components/application-step-contact";
import { ApplicationStepDocuments } from "../components/application-step-documents";
import { ApplicationStepFamily } from "../components/application-step-family";
import { ApplicationStepIdentity } from "../components/application-step-identity";
import { ApplicationStepPriorEducation } from "../components/application-step-prior-education";
import { ApplicationStepProgramChoices } from "../components/application-step-program-choices";
import { ApplicationStepRecap } from "../components/application-step-recap";
import { ApplicationSubmitted } from "../components/application-submitted";
import { useApplicationForm } from "../hooks/use-application-form";
import { TOTAL_STEPS } from "../services/application-schema";

/** Public admission application: an 8-step wizard with a local draft. */
export default function ApplicationFormPage() {
	const { t } = useTranslation();
	const {
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
		isSubmitting,
		contentRef,
		goNext,
		goBack,
		goToStep,
		handleSubmit,
	} = useApplicationForm();

	if (submittedReference) {
		return <ApplicationSubmitted referenceCode={submittedReference} />;
	}

	if (hasDraft) {
		return (
			<ApplicationDraftPrompt onResume={resumeDraft} onDiscard={discardDraft} />
		);
	}

	const stepTitles = Array.from({ length: TOTAL_STEPS }, (_, i) =>
		t(`admissions.steps.${i + 1}.title`),
	);

	return (
		<div className="min-h-dvh bg-gradient-to-br from-primary/5 to-background pb-16">
			{/* Header */}
			<div className="border-b bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-3xl px-4 py-4">
					<h1 className="font-semibold text-lg">
						{t("admissions.public.title")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("admissions.public.subtitle")}
					</p>
				</div>
			</div>

			<ApplicationProgress
				step={step}
				stepTitles={stepTitles}
				onStepClick={goToStep}
			/>

			{/* Content */}
			<div ref={contentRef} className="mx-auto max-w-3xl px-4 pt-6">
				<div className="mb-4 space-y-0.5">
					<h2 className="font-bold text-2xl">
						{t(`admissions.steps.${step}.title`)}
					</h2>
					<p className="text-muted-foreground">
						{t(`admissions.steps.${step}.subtitle`)}
					</p>
				</div>

				<Form {...form}>
					<Card className="shadow-sm">
						<CardContent className="pt-6 pb-4">
							{step === 1 && <ApplicationStepIdentity form={form} t={t} />}
							{step === 2 && <ApplicationStepContact form={form} t={t} />}
							{step === 3 && <ApplicationStepBac form={form} t={t} />}
							{step === 4 && (
								<ApplicationStepPriorEducation form={form} t={t} />
							)}
							{step === 5 && (
								<ApplicationStepProgramChoices
									form={form}
									t={t}
									programs={programs}
									academicYears={academicYears}
								/>
							)}
							{step === 6 && <ApplicationStepFamily form={form} t={t} />}
							{step === 7 && <ApplicationStepDocuments t={t} />}
							{step === 8 && (
								<ApplicationStepRecap
									form={form}
									t={t}
									programs={programs}
									academicYears={academicYears}
									goToStep={goToStep}
									certify={certify}
									setCertify={setCertify}
									certifyError={certifyError}
								/>
							)}
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="mt-4 flex items-center justify-between gap-3">
						<Button
							variant="outline"
							onClick={goBack}
							disabled={step === 1}
							className="gap-2"
						>
							<ChevronLeft className="size-4" />
							{t("admissions.wizard.back")}
						</Button>
						<span className="text-muted-foreground text-sm sm:hidden">
							{step} / {TOTAL_STEPS}
						</span>
						{step < TOTAL_STEPS ? (
							<Button onClick={goNext} className="gap-2">
								{t("admissions.wizard.next")}
								<ChevronRight className="size-4" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={isSubmitting}
								className="gap-2"
							>
								{isSubmitting ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<CheckCircle2 className="size-4" />
								)}
								{isSubmitting
									? t("admissions.wizard.submitting")
									: t("admissions.wizard.submit")}
							</Button>
						)}
					</div>
				</Form>
			</div>
		</div>
	);
}
