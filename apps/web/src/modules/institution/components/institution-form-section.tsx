import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
	InstitutionForm,
	InstitutionFormValues,
} from "../hooks/use-institution-form";

/** Where the institution form is shown: compact in the dialog, with hints on the settings page. */
export type InstitutionFormVariant = "dialog" | "page";

interface SectionProps {
	variant: InstitutionFormVariant;
	title: string;
	/** Shown under the title on the settings page only. */
	hint?: string;
	children: ReactNode;
}

/** One card of the institution form. */
export function InstitutionFormSection({
	variant,
	title,
	hint,
	children,
}: SectionProps) {
	const compact = variant === "dialog";
	return (
		<Card>
			<CardHeader className={compact ? "pb-3" : undefined}>
				<CardTitle className={compact ? "text-sm" : undefined}>
					{title}
				</CardTitle>
				{!compact && hint && <CardDescription>{hint}</CardDescription>}
			</CardHeader>
			<CardContent className="space-y-4">{children}</CardContent>
		</Card>
	);
}

type TextFieldName = {
	[K in keyof InstitutionFormValues]: InstitutionFormValues[K] extends
		| string
		| undefined
		? K
		: never;
}[keyof InstitutionFormValues];

interface TextFieldProps {
	form: InstitutionForm;
	name: TextFieldName;
	label: string;
	required?: boolean;
	type?: string;
	placeholder?: string;
	/** Renders a textarea of this many rows instead of an input. */
	rows?: number;
}

/** Text input (or textarea) bound to one field of the institution form. */
export function InstitutionTextField({
	form,
	name,
	label,
	required,
	type,
	placeholder,
	rows,
}: TextFieldProps) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel required={required}>{label}</FormLabel>
					<FormControl>
						{rows ? (
							<Textarea rows={rows} {...field} />
						) : (
							<Input type={type} placeholder={placeholder} {...field} />
						)}
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
