import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { Textarea } from "@/components/ui/textarea";
import type { TeachingUnitFormData } from "../hooks/use-teaching-unit-form";

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
	return (
		<>
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admin.teachingUnits.fields.name", {
								defaultValue: "Unit name",
							})}
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
							{t("admin.teachingUnits.fields.code", {
								defaultValue: "Code",
							})}
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
						<FormLabel>
							{t("admin.teachingUnits.fields.description", {
								defaultValue: "Description",
							})}
						</FormLabel>
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
							<FormLabel>
								{t("admin.teachingUnits.fields.credits", {
									defaultValue: "ECTS",
								})}
							</FormLabel>
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
					name="semester"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("admin.teachingUnits.fields.semester", {
									defaultValue: "Semester",
								})}
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="annual">
										{t("admin.teachingUnits.semesters.annual", {
											defaultValue: "Annual",
										})}
									</SelectItem>
									<SelectItem value="fall">
										{t("admin.teachingUnits.semesters.fall", {
											defaultValue: "Fall",
										})}
									</SelectItem>
									<SelectItem value="spring">
										{t("admin.teachingUnits.semesters.spring", {
											defaultValue: "Spring",
										})}
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
								{t("admin.teachingUnits.selectProgram", {
									defaultValue: "Select program",
								})}
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
