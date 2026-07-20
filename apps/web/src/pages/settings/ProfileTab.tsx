import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
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
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { authClient } from "../../lib/auth-client";
import { COUNTRIES } from "../../lib/countries";
import { cn } from "../../lib/utils";
import { useStore } from "../../store";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

type DomainProfile = RouterOutputs["users"]["getMyProfile"];

const normalizeDate = (value?: string | null) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().split("T")[0];
};

const buildProfileSchema = (
	t: (key: string, opts?: Record<string, unknown>) => string,
) =>
	z.object({
		firstName: z.string().min(1, t("settings.profile.validation.firstName")),
		lastName: z.string().min(1, t("settings.profile.validation.lastName")),
		phone: z.string().optional(),
		dateOfBirth: z.string().optional(),
		placeOfBirth: z.string().optional(),
		gender: z.enum(["male", "female", "other", ""]).optional(),
		nationality: z.string().optional(),
	});

type ProfileFormValues = z.infer<ReturnType<typeof buildProfileSchema>>;

export default function ProfileTab() {
	const { t, i18n } = useTranslation();
	const { user, setUser } = useStore();
	const { data: session } = authClient.useSession();
	const queryClient = useQueryClient();

	const profileSchema = buildProfileSchema(t);

	const profileForm = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			phone: "",
			dateOfBirth: "",
			placeOfBirth: "",
			gender: "",
			nationality: "",
		},
	});

	const profileQuery = useQuery({
		queryKey: ["myProfile"],
		queryFn: () => trpcClient.users.getMyProfile.query(),
	});
	const profile = profileQuery.data as DomainProfile | null | undefined;

	// Sync form with loaded profile
	const { reset } = profileForm;
	if (profile && !profileForm.formState.isDirty) {
		reset({
			firstName: profile.firstName ?? "",
			lastName: profile.lastName ?? "",
			phone: profile.phone ?? "",
			dateOfBirth: normalizeDate(profile.dateOfBirth),
			placeOfBirth: profile.placeOfBirth ?? "",
			gender: profile.gender || "",
			nationality: profile.nationality ?? "",
		});
	}

	const updateProfileMutation = useMutation({
		mutationFn: async (values: ProfileFormValues) =>
			trpcClient.users.updateMyProfile.mutate({
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				phone: values.phone?.trim() || null,
				dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : null,
				placeOfBirth: values.placeOfBirth?.trim() || null,
				gender: values.gender || undefined,
				nationality: values.nationality?.trim() || null,
			}),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: ["myProfile"] });
			if (updated && user) {
				setUser({
					...user,
					firstName: updated.firstName ?? user.firstName,
					lastName: updated.lastName ?? user.lastName,
				});
			}
			toast.success(t("settings.profile.toast.success"));
		},
		onError: () => toast.error(t("settings.profile.toast.error")),
	});

	const initials =
		`${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.trim() ||
		"?";

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
					<Form {...profileForm}>
						<form
							onSubmit={profileForm.handleSubmit((values) =>
								updateProfileMutation.mutate(values),
							)}
							className="space-y-6"
						>
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
									<p className="text-muted-foreground text-xs">
										{session?.user?.email ?? user?.email}
									</p>
								</div>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={profileForm.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.profile.fields.firstName")}
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={profileForm.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.profile.fields.lastName")}
											</FormLabel>
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
									<label
										className="font-medium text-sm"
										htmlFor="settings-email"
									>
										{t("settings.profile.fields.email")}
									</label>
									<Input
										id="settings-email"
										value={session?.user?.email ?? user?.email ?? ""}
										disabled
									/>
								</div>
								<FormField
									control={profileForm.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.profile.fields.phone")}
											</FormLabel>
											<FormControl>
												<PhoneInput
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={profileForm.control}
									name="dateOfBirth"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.profile.fields.dateOfBirth")}
											</FormLabel>
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
									control={profileForm.control}
									name="placeOfBirth"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.profile.fields.placeOfBirth")}
											</FormLabel>
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
									control={profileForm.control}
									name="gender"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.profile.fields.gender")}
											</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
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
									control={profileForm.control}
									name="nationality"
									render={({ field }) => {
										const isFr = i18n.language.startsWith("fr");
										const selectedCountry = COUNTRIES.find(
											(c) =>
												c.code === field.value ||
												c.nameEn === field.value ||
												c.nameFr === field.value,
										);
										const displayName = selectedCountry
											? isFr
												? selectedCountry.nameFr
												: selectedCountry.nameEn
											: field.value;
										return (
											<FormItem className="flex flex-col">
												<FormLabel>
													{t("settings.profile.fields.nationality")}
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full justify-between font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{displayName ||
																	t(
																		"settings.profile.fields.nationalityPlaceholder",
																	)}
																<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className="w-[--radix-popover-trigger-width] p-0"
														align="start"
													>
														<Command>
															<CommandInput
																placeholder={t(
																	"settings.profile.fields.nationalitySearch",
																)}
															/>
															<CommandList>
																<CommandEmpty>
																	{t("common.noResults")}
																</CommandEmpty>
																<CommandGroup>
																	{COUNTRIES.map((country) => (
																		<CommandItem
																			key={country.code}
																			value={`${country.nameEn} ${country.nameFr}`}
																			onSelect={() =>
																				field.onChange(country.code)
																			}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					field.value === country.code
																						? "opacity-100"
																						: "opacity-0",
																				)}
																			/>
																			{isFr ? country.nameFr : country.nameEn}
																		</CommandItem>
																	))}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="justify-end">
					<Button
						type="submit"
						onClick={profileForm.handleSubmit((values) =>
							updateProfileMutation.mutate(values),
						)}
						disabled={updateProfileMutation.isPending}
					>
						{t("settings.profile.save")}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
