import type { Control } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
	ProgramDetailsFormController,
	ProgramDetailsFormData,
} from "../hooks/use-program-details-form";

type TextFieldName = Exclude<
	keyof ProgramDetailsFormData,
	"description" | "cycleId" | "centerId" | "isCenterProgram"
>;

/** `[field, label key, default label]` of the plain text inputs. */
type TextFieldSpec = [TextFieldName, string, string];

const IDENTITY_FIELDS: TextFieldSpec[] = [
	["name", "admin.programs.fields.name", "Name (FR)"],
	["nameEn", "admin.programs.fields.nameEn", "Name (EN)"],
	["code", "admin.programs.fields.code", "Code"],
	["abbreviation", "admin.programs.fields.abbreviation", "Abbreviation"],
];

const ACADEMIC_FIELDS: TextFieldSpec[] = [
	["domainFr", "admin.programs.fields.domainFr", "Domain (FR)"],
	["domainEn", "admin.programs.fields.domainEn", "Domain (EN)"],
	["specialiteFr", "admin.programs.fields.specialiteFr", "Speciality (FR)"],
	["specialiteEn", "admin.programs.fields.specialiteEn", "Speciality (EN)"],
];

const DOCUMENT_FIELDS: TextFieldSpec[] = [
	[
		"diplomaTitleFr",
		"admin.programs.fields.diplomaTitleFr",
		"Diploma title (FR)",
	],
	[
		"diplomaTitleEn",
		"admin.programs.fields.diplomaTitleEn",
		"Diploma title (EN)",
	],
	[
		"attestationValidityFr",
		"admin.programs.fields.attestationValidityFr",
		"Attestation validity (FR)",
	],
	[
		"attestationValidityEn",
		"admin.programs.fields.attestationValidityEn",
		"Attestation validity (EN)",
	],
];

function TextFields({
	control,
	fields,
}: {
	control: Control<ProgramDetailsFormData>;
	fields: TextFieldSpec[];
}) {
	const { t } = useTranslation();
	return fields.map(([name, labelKey, defaultValue]) => (
		<FormField
			key={name}
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t(labelKey, { defaultValue })}</FormLabel>
					<FormControl>
						<Input {...field} value={field.value ?? ""} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	));
}

function NullableSelectField({
	control,
	name,
	label,
	items,
}: {
	control: Control<ProgramDetailsFormData>;
	name: "cycleId" | "centerId";
	label: string;
	items: { id: string; name: string }[];
}) {
	const { t } = useTranslation();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<Select
						onValueChange={(v) => field.onChange(v === "none" ? null : v)}
						value={field.value ?? "none"}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue
									placeholder={t("common.none", { defaultValue: "None" })}
								/>
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							<SelectItem value="none">
								{t("common.none", { defaultValue: "None" })}
							</SelectItem>
							{items.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

/** Fields of the program details form; `selectedCenterId` is watched by the hook. */
export function ProgramDetailsFields({
	controller,
}: {
	controller: ProgramDetailsFormController;
}) {
	const { t } = useTranslation();
	const { form, cycles, centers, selectedCenterId } = controller;
	const control = form.control;

	return (
		<>
			{/* Identity */}
			<div className="grid gap-4 md:grid-cols-2">
				<TextFields control={control} fields={IDENTITY_FIELDS} />
			</div>
			<FormField
				control={control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admin.programs.fields.description", {
								defaultValue: "Description",
							})}
						</FormLabel>
						<FormControl>
							<Textarea {...field} value={field.value ?? ""} rows={3} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Academic */}
			<div className="grid gap-4 md:grid-cols-2">
				<TextFields control={control} fields={ACADEMIC_FIELDS} />
				<NullableSelectField
					control={control}
					name="cycleId"
					label={t("admin.programs.fields.cycle", { defaultValue: "Cycle" })}
					items={cycles}
				/>
				<NullableSelectField
					control={control}
					name="centerId"
					label={t("admin.programs.fields.center", { defaultValue: "Center" })}
					items={centers}
				/>
			</div>

			{selectedCenterId && (
				<FormField
					control={control}
					name="isCenterProgram"
					render={({ field }) => (
						<FormItem className="flex items-center gap-3">
							<FormControl>
								<Switch
									checked={field.value ?? false}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel className="mt-0">
								{t("admin.programs.fields.isCenterProgram", {
									defaultValue: "Center program",
								})}
							</FormLabel>
						</FormItem>
					)}
				/>
			)}

			{/* Document titles */}
			<div className="grid gap-4 md:grid-cols-2">
				<TextFields control={control} fields={DOCUMENT_FIELDS} />
			</div>
		</>
	);
}
