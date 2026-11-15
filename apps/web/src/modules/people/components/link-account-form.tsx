import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLinkAuthAccount } from "../hooks/use-profile-auth";
import {
	type LinkAccountValues,
	linkAccountSchema,
} from "../services/profile-access";

export function LinkAccountForm({ profileId }: { profileId: string }) {
	const { t } = useTranslation();
	const form = useForm<LinkAccountValues>({
		resolver: zodResolver(linkAccountSchema),
		defaultValues: { authEmail: "" },
	});

	const mutation = useLinkAuthAccount(profileId);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="authEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("usersHub.account.link.emailLabel")}</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder={t("usersHub.account.link.emailPlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<p className="text-muted-foreground text-xs">
					{t("usersHub.account.link.hint")}
				</p>
				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{t("usersHub.account.link.submit")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
