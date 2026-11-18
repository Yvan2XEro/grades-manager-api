import type { FieldPath, UseFormReturn } from "react-hook-form";
import { ImageUploadField } from "@/components/inputs/ImageUploadField";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { CenterForm } from "../hooks/use-center-form";

interface Props {
	form: UseFormReturn<CenterForm>;
	urlName: FieldPath<CenterForm>;
	svgName: FieldPath<CenterForm>;
	label: string;
	description: string;
	/** Label of the SVG code textarea, which takes precedence over the image. */
	svgLabel: string;
	className?: string;
}

/** A logo given as an uploaded image, or as SVG code. */
export function CenterLogoField({
	form,
	urlName,
	svgName,
	label,
	description,
	svgLabel,
	className = "space-y-3",
}: Props) {
	return (
		<div className={className}>
			<FormField
				control={form.control}
				name={urlName}
				render={({ field }) => (
					<FormItem>
						<ImageUploadField
							label={label}
							description={description}
							value={field.value as string | undefined}
							onChange={field.onChange}
							onClear={() => field.onChange("")}
							placeholder="https://..."
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name={svgName}
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-xs">{svgLabel}</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								value={(field.value as string | undefined) ?? ""}
								rows={4}
								placeholder="<svg ...>...</svg>"
								className="font-mono text-xs"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
