import { UserCircle } from "lucide-react";
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAccountForm } from "../hooks/use-account-form";
import { AvatarUpload } from "./avatar-upload";
import { EmailChangeField } from "./email-change-field";

/** Avatar, display name and email of the auth account. */
export function AccountCard() {
	const { t } = useTranslation();
	const { form, submit, isPending } = useAccountForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserCircle className="h-4 w-4 text-primary" />
					{t("settings.account.title")}
				</CardTitle>
				<CardDescription>{t("settings.account.description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<AvatarUpload />

				<Separator />

				<Form {...form}>
					<form onSubmit={submit} className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("settings.account.fields.name")}</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>

				<Separator />

				<EmailChangeField />
			</CardContent>
			<CardFooter className="justify-end">
				<Button type="submit" onClick={submit} disabled={isPending}>
					{t("settings.account.save")}
				</Button>
			</CardFooter>
		</Card>
	);
}
