import { BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { useStore } from "@/store";
import { ProfileFormFields } from "../components/profile-form-fields";
import { useProfileForm } from "../hooks/use-profile-form";

export default function ProfileTab() {
	const { t } = useTranslation();
	const { user } = useStore();
	const { data: session } = authClient.useSession();
	const { form, submit, isPending, profile, initials } = useProfileForm();
	const email = session?.user?.email ?? user?.email;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BadgeCheck className="h-4 w-4 text-primary" />
						{t("settings.profile.title")}
					</CardTitle>
					<CardDescription>{t("settings.profile.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={submit} className="space-y-6">
							<div className="flex items-center gap-4 rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-4">
								<Avatar className="h-12 w-12">
									<AvatarFallback className="bg-primary/10 font-semibold text-primary">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-medium">
										{profile?.firstName} {profile?.lastName}
									</p>
									<p className="text-muted-foreground text-xs">{email}</p>
								</div>
							</div>
							<ProfileFormFields form={form} email={email ?? ""} />
						</form>
					</Form>
				</CardContent>
				<CardFooter className="justify-end">
					<Button type="submit" onClick={submit} disabled={isPending}>
						{t("settings.profile.save")}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
