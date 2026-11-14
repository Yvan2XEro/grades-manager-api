import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApplicationWizardForm } from "../types";

/** Step 8 — recap of every step, certification and submit. */
export function ApplicationStepRecap({
	form,
	t,
	programs,
	academicYears,
	goToStep,
	certify,
	setCertify,
	certifyError,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
	programs: { id: string; name: string }[];
	academicYears: { id: string; name: string }[];
	goToStep: (n: number) => void;
	certify: boolean;
	setCertify: (v: boolean) => void;
	certifyError: boolean;
}) {
	const v = form.getValues();
	const noVal = t("admissions.wizard.noValue");
	const prog = (id?: string) =>
		programs.find((p) => p.id === id)?.name ?? noVal;
	const year = (id?: string) =>
		academicYears.find((y) => y.id === id)?.name ?? noVal;

	const sections = [
		{
			step: 1,
			title: t("admissions.recap.identity"),
			rows: [
				[t("admissions.fields.lastName"), v.lastName],
				[t("admissions.fields.firstName"), v.firstName],
				[
					t("admissions.fields.gender"),
					v.gender ? t(`admissions.options.gender.${v.gender}`) : "",
				],
				[t("admissions.fields.dateOfBirth"), v.dateOfBirth],
				[t("admissions.fields.placeOfBirth"), v.placeOfBirth],
				[t("admissions.fields.idCardNumber"), v.idCardNumber],
				[
					t("admissions.fields.maritalStatus"),
					v.maritalStatus
						? t(`admissions.options.maritalStatus.${v.maritalStatus}`)
						: "",
				],
			],
		},
		{
			step: 2,
			title: t("admissions.recap.contact"),
			rows: [
				[t("admissions.fields.email"), v.email],
				[t("admissions.fields.phone"), v.phone],
				[t("admissions.fields.nationality"), v.nationality],
				[
					t("admissions.fields.studentStatus"),
					v.studentStatus
						? t(`admissions.options.studentStatus.${v.studentStatus}`)
						: "",
				],
				[t("admissions.fields.originCountry"), v.originCountry],
				[t("admissions.fields.originRegion"), v.originRegion],
			],
		},
		{
			step: 3,
			title: t("admissions.recap.diploma"),
			rows: [
				[
					t("admissions.fields.entryDiplomaType"),
					v.entryDiplomaType
						? t(`admissions.options.diplomaType.${v.entryDiplomaType}`)
						: "",
				],
				[t("admissions.fields.bacSeries"), v.bacSeries],
				[t("admissions.fields.bacYear"), v.bacYear],
				[
					t("admissions.fields.bacMention"),
					v.bacMention
						? t(`admissions.options.bacMention.${v.bacMention}`)
						: "",
				],
				[t("admissions.fields.bacInstitution"), v.bacInstitution],
			],
		},
		{
			step: 4,
			title: t("admissions.recap.higherEd"),
			rows: v.hasPriorHigherEd
				? [
						[t("admissions.fields.priorInstitution"), v.priorInstitution],
						[t("admissions.fields.priorField"), v.priorField],
						[t("admissions.fields.priorLevel"), v.priorLevel],
					]
				: [[t("admissions.recap.noPriorHigherEd"), ""]],
		},
		{
			step: 5,
			title: t("admissions.recap.programs"),
			rows: [
				[t("admissions.fields.academicYear"), year(v.academicYearId)],
				[t("admissions.fields.academicLevel"), v.academicLevel],
				[t("admissions.fields.program"), prog(v.programId)],
				[
					t("admissions.fields.secondChoiceProgram"),
					prog(v.secondChoiceProgramId),
				],
			],
		},
		{
			step: 6,
			title: t("admissions.recap.family"),
			rows: [
				[t("admissions.fields.fatherName"), v.fatherName],
				[t("admissions.fields.motherName"), v.motherName],
				[t("admissions.fields.emergencyContactName"), v.emergencyContactName],
				[t("admissions.fields.emergencyContactPhone"), v.emergencyContactPhone],
			],
		},
	];

	return (
		<div className="space-y-4">
			{sections.map((sec) => (
				<div key={sec.step} className="overflow-hidden rounded-xl border">
					<div className="flex items-center justify-between bg-muted/40 px-4 py-2">
						<span className="font-medium text-sm">{sec.title}</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 gap-1 text-xs"
							onClick={() => goToStep(sec.step)}
						>
							{t("admissions.wizard.editStep")}
						</Button>
					</div>
					<div className="divide-y">
						{sec.rows.map(([label, value]) => (
							<div key={label} className="flex gap-3 px-4 py-2 text-sm">
								<span className="w-48 shrink-0 text-muted-foreground">
									{label}
								</span>
								<span
									className={
										value ? "font-medium" : "text-muted-foreground/50 italic"
									}
								>
									{value || noVal}
								</span>
							</div>
						))}
					</div>
				</div>
			))}
			<div
				className={`mt-6 rounded-xl border-2 p-4 transition-colors ${certifyError ? "border-destructive bg-destructive/5" : "border-primary/20 bg-primary/5"}`}
			>
				<label className="flex cursor-pointer items-start gap-3">
					<Checkbox
						checked={certify}
						onCheckedChange={(v) => setCertify(!!v)}
						className="mt-0.5"
					/>
					<span className="text-sm leading-relaxed">
						{t("admissions.wizard.certify")}
					</span>
				</label>
				{certifyError && (
					<p className="mt-2 text-destructive text-xs">
						{t("admissions.wizard.certifyRequired")}
					</p>
				)}
			</div>
		</div>
	);
}
