import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
	value: string;
	label: string;
	description?: string;
}

interface ComboboxProps {
	options: ComboboxOption[];
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	className?: string;
	disabled?: boolean;
	clearable?: boolean;
	/** Show search input only when options exceed this count. Default: 7 */
	searchThreshold?: number;
}

export function Combobox({
	options,
	value,
	onValueChange,
	placeholder,
	searchPlaceholder,
	emptyText,
	className,
	disabled,
	clearable = true,
	searchThreshold = 7,
}: ComboboxProps) {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation();

	const selected = options.find((opt) => opt.value === value);

	const handleSelect = (optValue: string) => {
		onValueChange?.(optValue === value ? "" : optValue);
		setOpen(false);
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onValueChange?.("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						"w-full justify-between gap-2 font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<span className="flex-1 truncate text-left">
						{selected ? selected.label : (placeholder ?? t("common.select", { defaultValue: "Sélectionner..." }))}
					</span>
					<div className="flex shrink-0 items-center gap-1">
						{clearable && selected && (
							<X
								className="h-3.5 w-3.5 opacity-50 hover:opacity-100 transition-opacity"
								onClick={handleClear}
							/>
						)}
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
				<Command>
					{options.length > searchThreshold && (
						<CommandInput
							placeholder={searchPlaceholder ?? t("common.search", { defaultValue: "Rechercher..." })}
						/>
					)}
					<CommandList>
						<CommandEmpty>
							{emptyText ?? t("common.noResults", { defaultValue: "Aucun résultat." })}
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.label}
									onSelect={() => handleSelect(option.value)}
									className="gap-2"
								>
									<Check
										className={cn(
											"h-4 w-4 shrink-0 transition-opacity",
											value === option.value ? "opacity-100 text-primary" : "opacity-0",
										)}
									/>
									<div className="flex flex-col min-w-0">
										<span className="truncate">{option.label}</span>
										{option.description && (
											<span className="text-muted-foreground text-xs truncate">
												{option.description}
											</span>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
