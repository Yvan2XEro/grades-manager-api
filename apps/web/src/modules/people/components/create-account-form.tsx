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
import { PasswordInput } from "@/components/ui/password-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCreateAuthAccount } from "../hooks/use-profile-auth";
import {
	ASSIGNABLE_ROLES,
	type CreateAccountValues,
	createAccountSchema,
} from "../services/profile-access";

export function CreateAccountForm({ profileId }: { profileId: string }) {
	const form = useForm<CreateAccountValues>({
		resolver: zodResolver(createAccountSchema),
		defaultValues: { email: "", password: "", memberRole: "student" },
	});

	const mutation = useCreateAuthAccount(profileId);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="prenom.nom@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Mot de passe</FormLabel>
								<FormControl>
									<PasswordInput {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="memberRole"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Rôle</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Choisir un rôle" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ASSIGNABLE_ROLES.map((r) => (
											<SelectItem key={r.value} value={r.value}>
												{r.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Créer le compte
					</Button>
				</div>
			</form>
		</Form>
	);
}
