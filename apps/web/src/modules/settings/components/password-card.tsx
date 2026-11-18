import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { usePasswordForm } from "../hooks/use-password-form";

export function PasswordCard() {
	const { t } = useTranslation();
	const { form, submit, isPending } = usePasswordForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Lock className="h-4 w-4 text-primary" />
					{t("settings.password.title")}
				</CardTitle>
				<CardDescription>{t("settings.password.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={submit} className="space-y-4">
						<FormField
							control={form.control}
							name="currentPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("settings.password.fields.current")}</FormLabel>
									<FormControl>
										<PasswordInput {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="newPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("settings.password.fields.new")}</FormLabel>
										<FormControl>
											<PasswordInput {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("settings.password.fields.confirm")}
										</FormLabel>
										<FormControl>
											<PasswordInput {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="revokeOtherSessions"
							render={({ field }) => (
								<FormItem className="flex items-center gap-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={(value) =>
												field.onChange(Boolean(value))
											}
										/>
									</FormControl>
									<FormLabel className="text-sm">
										{t("settings.password.fields.revokeOthers")}
									</FormLabel>
								</FormItem>
							)}
						/>
					</form>
				</Form>
			</CardContent>
			<CardFooter className="justify-end">
				<Button type="submit" onClick={submit} disabled={isPending}>
					{t("settings.password.save")}
				</Button>
			</CardFooter>
		</Card>
	);
}
