import { Checkbox } from "@/components/ui/checkbox";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ApplicationWizardForm } from "../types";

import { OptionalBadge } from "./optional-badge";

/** Step 6 — parents, legal guardian and emergency contact. */
export function ApplicationStepFamily({
	form,
	t,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
}) {
	return (
		<div className="space-y-6">
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Père
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="fatherName"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.fatherName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fatherProfession"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.fatherProfession")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fatherPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.fatherPhone")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fatherAlive"
						render={({ field }) => (
							<FormItem className="flex items-center gap-2 space-y-0 self-end pb-1">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="font-normal">
									{t("admissions.fields.fatherAlive")}
								</FormLabel>
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Mère
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="motherName"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.motherName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="motherProfession"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.motherProfession")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="motherPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.motherPhone")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="motherAlive"
						render={({ field }) => (
							<FormItem className="flex items-center gap-2 space-y-0 self-end pb-1">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="font-normal">
									{t("admissions.fields.motherAlive")}
								</FormLabel>
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Tuteur légal <OptionalBadge label="opt." />
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="guardianName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admissions.fields.guardianName")}</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="guardianRelation"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admissions.fields.guardianRelation")}</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Oncle, Frère aîné" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="guardianPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admissions.fields.guardianPhone")}</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Contact d'urgence
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="emergencyContactName"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.emergencyContactName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emergencyContactPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.emergencyContactPhone")}
								</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emergencyContactCity"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.emergencyContactCity")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
}
