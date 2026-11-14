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
import { CMR_REGIONS } from "../services/cameroon-data";
import type { ApplicationWizardForm } from "../types";
import { OptionalBadge } from "./optional-badge";

/** Step 2 — contact details and origin (region → department). */
export function ApplicationStepContact({
	form,
	t,
}: {
	form: ApplicationWizardForm;
	t: (k: string) => string;
}) {
	const originRegion = useWatch({
		control: form.control,
		name: "originRegion",
	});
	const studentStatus = useWatch({
		control: form.control,
		name: "studentStatus",
	});
	const departments = CMR_REGIONS[originRegion ?? ""] ?? [];

	return (
		<div className="space-y-6">
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Contact
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>{t("admissions.fields.email")}</FormLabel>
								<FormControl>
									<Input
										type="email"
										{...field}
										placeholder="votre@email.com"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>{t("admissions.fields.phone")}</FormLabel>
								<FormControl>
									<Input type="tel" {...field} placeholder="6X XX XX XX XX" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="whatsapp"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.whatsapp")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input
										type="tel"
										{...field}
										placeholder="Si différent du téléphone"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.city")} <OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Yaoundé" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.address")}{" "}
									<OptionalBadge label="opt." />
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
						name="postalBox"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.postalBox")}{" "}
									<OptionalBadge label="opt." />
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : 12345" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Nationalité & Origine
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="nationality"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.nationality")}
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Camerounaise" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="studentStatus"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.studentStatus")}
								</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{[
											"camerounais",
											"etranger_cemac",
											"etranger_hors_cemac",
										].map((v) => (
											<SelectItem key={v} value={v}>
												{t(`admissions.options.studentStatus.${v}`)}
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
						name="originCountry"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.originCountry")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{studentStatus === "camerounais" && (
						<>
							<FormField
								control={form.control}
								name="originRegion"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admissions.fields.originRegion")}{" "}
											<OptionalBadge label="opt." />
										</FormLabel>
										<Select
											onValueChange={(v) => {
												field.onChange(v);
												form.setValue("originDepartment", "");
											}}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="—" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.keys(CMR_REGIONS).map((r) => (
													<SelectItem key={r} value={r}>
														{r}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							{originRegion && departments.length > 0 && (
								<FormField
									control={form.control}
									name="originDepartment"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admissions.fields.originDepartment")}{" "}
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
													{departments.map((d) => (
														<SelectItem key={d} value={d}>
															{d}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
