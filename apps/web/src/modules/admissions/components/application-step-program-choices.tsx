import { useWatch } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationWizardForm } from "../types";

import { OptionalBadge } from "./optional-badge";

/** Step 5 — academic year, level and up to three program choices. */
export function ApplicationStepProgramChoices({
	form,
	t,
	programs,
	academicYears,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
	programs: { id: string; name: string; code: string }[];
	academicYears: { id: string; name: string }[];
}) {
	const secondChoiceProgramId = useWatch({
		control: form.control,
		name: "secondChoiceProgramId",
	});
	const programId = useWatch({ control: form.control, name: "programId" });
	const personalStatement =
		useWatch({ control: form.control, name: "personalStatement" }) ?? "";

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="academicYearId"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.academicYear")}
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{academicYears.map((y) => (
										<SelectItem key={y.id} value={y.id}>
											{y.name}
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
					name="academicLevel"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.academicLevel")}
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
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
					name="trainingType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("admissions.fields.trainingType")}{" "}
								<OptionalBadge label="opt." />
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value ?? ""}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{["initiale", "professionnalisante", "continue"].map((v) => (
										<SelectItem key={v} value={v}>
											{t(`admissions.options.trainingType.${v}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Vœux de formation
				</p>
				<div className="space-y-3">
					<FormField
						control={form.control}
						name="programId"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>{t("admissions.fields.program")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{programs.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name}
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
						name="secondChoiceProgramId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.secondChoiceProgram")}{" "}
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
										{programs
											.filter((p) => p.id !== programId)
											.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.name}
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
						name="thirdChoiceProgramId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.thirdChoiceProgram")}{" "}
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
										{programs
											.filter(
												(p) =>
													p.id !== programId && p.id !== secondChoiceProgramId,
											)
											.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
			<FormField
				control={form.control}
				name="personalStatement"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.personalStatement")}{" "}
							<OptionalBadge label="opt." />
						</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								rows={5}
								placeholder="Décrivez votre projet professionnel et vos motivations..."
								maxLength={3000}
							/>
						</FormControl>
						<p className="text-right text-muted-foreground text-xs">
							{personalStatement.length}/3000
						</p>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
