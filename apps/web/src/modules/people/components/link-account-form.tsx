import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
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
							<FormLabel>Email du compte existant</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="utilisateur@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<p className="text-muted-foreground text-xs">
					L'utilisateur doit déjà être membre de l'organisation. Son profil sera
					lié à ce compte d'accès.
				</p>
				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Lier le compte
					</Button>
				</div>
			</form>
		</Form>
	);
}
