import { useWatch } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ApplicationWizardForm } from "../types";

import { OptionalBadge } from "./optional-badge";

/** Step 4 — prior higher education, when any. */
export function ApplicationStepPriorEducation({
	form,
	t,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
}) {
	const hasPrior = useWatch({
		control: form.control,
		name: "hasPriorHigherEd",
	});

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="hasPriorHigherEd"
				render={({ field }) => (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => field.onChange(false)}
							className={`rounded-xl border-2 p-4 text-left transition-all ${!field.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
						>
							<p className="font-medium text-sm">
								{t("admissions.wizard.priorHigherEdNo")}
							</p>
						</button>
						<button
							type="button"
							onClick={() => field.onChange(true)}
							className={`rounded-xl border-2 p-4 text-left transition-all ${field.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
						>
							<p className="font-medium text-sm">
								{t("admissions.wizard.priorHigherEdYes")}
							</p>
						</button>
					</div>
				)}
			/>
			{hasPrior && (
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="priorInstitution"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.priorInstitution")}
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Ex : Université de Yaoundé I"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorField"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.priorField")}
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Informatique" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorLevel"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.priorLevel")}
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{["L1", "L2", "L3", "M1", "M2", "Doctorat"].map((l) => (
											<SelectItem key={l} value={l}>
												{t(`admissions.options.academicLevel.${l}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorResult"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.priorResult")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{["admis", "non_admis", "en_cours"].map((v) => (
											<SelectItem key={v} value={v}>
												{t(`admissions.options.priorResult.${v}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorStartYear"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.priorStartYear")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1990}
										max={new Date().getFullYear()}
										{...field}
										placeholder="Ex : 2022"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorEndYear"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.priorEndYear")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1990}
										max={new Date().getFullYear() + 1}
										{...field}
										placeholder="Ex : 2023"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			)}
		</div>
	);
}
