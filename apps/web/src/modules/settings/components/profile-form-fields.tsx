import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@/components/ui/date-picker";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ProfileFormValues } from "../hooks/use-profile-form";
import { NationalityField } from "./nationality-field";

/** Fields of the user's own profile form (email is read-only). */
export function ProfileFormFields({
	form,
	email,
}: {
	form: UseFormReturn<ProfileFormValues>;
	email: string;
}) {
	const { t } = useTranslation();
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="firstName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("settings.profile.fields.firstName")}</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="lastName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("settings.profile.fields.lastName")}</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="settings-email">
						{t("settings.profile.fields.email")}
					</label>
					<Input id="settings-email" value={email} disabled />
				</div>
				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("settings.profile.fields.phone")}</FormLabel>
							<FormControl>
								<PhoneInput value={field.value} onChange={field.onChange} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="dateOfBirth"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("settings.profile.fields.dateOfBirth")}</FormLabel>
							<FormControl>
								<DatePicker
									value={field.value ?? ""}
									onChange={field.onChange}
									placeholder={t(
										"settings.profile.fields.dateOfBirthPlaceholder",
									)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="placeOfBirth"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("settings.profile.fields.placeOfBirth")}</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="gender"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("settings.profile.fields.gender")}</FormLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"settings.profile.fields.genderPlaceholder",
											)}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="male">
										{t("settings.profile.gender.male")}
									</SelectItem>
									<SelectItem value="female">
										{t("settings.profile.gender.female")}
									</SelectItem>
									<SelectItem value="other">
										{t("settings.profile.gender.other")}
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="nationality"
					render={({ field }) => <NationalityField field={field} />}
				/>
			</div>
		</>
	);
}
