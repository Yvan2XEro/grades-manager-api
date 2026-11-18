import { Check, ChevronsUpDown } from "lucide-react";
import type { ControllerRenderProps } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { ProfileFormValues } from "../hooks/use-profile-form";

/** Searchable country picker; stores the country code. */
export function NationalityField({
	field,
}: {
	field: ControllerRenderProps<ProfileFormValues, "nationality">;
}) {
	const { t, i18n } = useTranslation();
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
			<FormLabel>{t("settings.profile.fields.nationality")}</FormLabel>
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
								t("settings.profile.fields.nationalityPlaceholder")}
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
							placeholder={t("settings.profile.fields.nationalitySearch")}
						/>
						<CommandList>
							<CommandEmpty>{t("common.noResults")}</CommandEmpty>
							<CommandGroup>
								{COUNTRIES.map((country) => (
									<CommandItem
										key={country.code}
										value={`${country.nameEn} ${country.nameFr}`}
										onSelect={() => field.onChange(country.code)}
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
}
