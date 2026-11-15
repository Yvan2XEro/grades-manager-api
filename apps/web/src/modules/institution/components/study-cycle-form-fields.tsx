import { useTranslation } from "react-i18next";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StudyCycleForm } from "../hooks/use-study-cycle-form";

/** Name, code, description, credits and duration of a study cycle. */
export function StudyCycleFormFields({ form }: { form: StudyCycleForm }) {
	const { t } = useTranslation();
	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>{t("admin.studyCycles.form.name")}</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Licence" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="nameEn"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.studyCycles.form.nameEn")}</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Bachelor of Science" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="code"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>{t("admin.studyCycles.form.code")}</FormLabel>
							<FormControl>
								<Input {...field} placeholder="BSC" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.studyCycles.form.description")}</FormLabel>
						<FormControl>
							<Textarea {...field} rows={3} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="totalCreditsRequired"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.studyCycles.form.credits")}</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={30}
									{...field}
									value={field.value as number}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="durationYears"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("admin.studyCycles.form.duration")}</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									{...field}
									value={field.value as number}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}
