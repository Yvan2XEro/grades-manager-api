import { type UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	FormControl,
	FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
	type TeachingUnitFormData,
	useProgramLevels,
} from "../hooks/use-teaching-unit-form";

const NO_LEVEL = "__none";

interface TeachingUnitFormFieldsProps {
	form: UseFormReturn<TeachingUnitFormData>;
	/** Programs to choose from; omit when the program is fixed by the caller. */
	programs?: { id: string; name: string }[];
}

/** Fields of a teaching unit, shared by the create dialog and the detail page. */
export function TeachingUnitFormFields({
	form,
	programs,
}: TeachingUnitFormFieldsProps) {
	const { t } = useTranslation();
	const levels = useProgramLevels(
		useWatch({ control: form.control, name: "programId" }),
	);
	return (
		<>
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admin.teachingUnits.fields.name")}
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
				name="code"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admin.teachingUnits.fields.code")}
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
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.teachingUnits.fields.description")}</FormLabel>
						<FormControl>
							<Textarea {...field} rows={4} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="credits"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.teachingUnits.fields.credits")}</FormLabel>
							<FormControl>
								<Input
									type="number"
									value={field.value ?? ""}
									onChange={(event) =>
										field.onChange(
											event.target.value === ""
												? undefined
												: Number(event.target.value),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="cycleLevelId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.teachingUnits.fields.level")}</FormLabel>
							<Select
								onValueChange={(value) =>
									field.onChange(value === NO_LEVEL ? null : value)
								}
								value={field.value ?? NO_LEVEL}
								disabled={!levels.length}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={NO_LEVEL}>
										{t("admin.teachingUnits.noLevel")}
									</SelectItem>
									{levels.map((level) => (
										<SelectItem key={level.id} value={level.id}>
											{level.code} — {level.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								{t("admin.teachingUnits.levelHint")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="semester"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.teachingUnits.fields.semester")}</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="annual">
										{t("admin.teachingUnits.semesters.annual")}
									</SelectItem>
									<SelectItem value="fall">
										{t("admin.teachingUnits.semesters.fall")}
									</SelectItem>
									<SelectItem value="spring">
										{t("admin.teachingUnits.semesters.spring")}
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			{programs && (
				<FormField
					control={form.control}
					name="programId"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admin.teachingUnits.selectProgram")}
							</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value || undefined}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t("admin.teachingUnits.selectProgram")}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{programs.map((program) => (
										<SelectItem key={program.id} value={program.id}>
											{program.name}
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
	);
}
