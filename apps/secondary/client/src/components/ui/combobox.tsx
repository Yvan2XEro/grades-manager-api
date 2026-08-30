import type { LucideIcon } from "lucide-react";
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

// ─── PillCombobox ─────────────────────────────────────────────────────────────
// Compact pill-shaped trigger for filter/selector toolbars (backend-data selects)

interface PillComboboxProps {
	options: Array<{ value: string; label: string }>;
	value?: string;
	onValueChange: (value: string) => void;
	placeholder: string;
	icon?: LucideIcon;
	disabled?: boolean;
	className?: string;
	/** Width of the dropdown. Default "w-56" */
	popoverWidth?: string;
}

export function PillCombobox({
	options,
	value,
	onValueChange,
	placeholder,
	icon: Icon,
	disabled,
	className,
	popoverWidth = "w-56",
}: PillComboboxProps) {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation();

	const selected = options.find((o) => o.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					disabled={disabled}
					className={cn(
						"inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 font-medium text-xs transition-colors",
						disabled
							? "cursor-not-allowed bg-muted/20 opacity-50"
							: "cursor-pointer bg-muted/50 hover:bg-muted",
						selected ? "text-foreground" : "text-muted-foreground",
						className,
					)}
				>
					{Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />}
					<span className="max-w-[180px] truncate">
						{selected ? selected.label : placeholder}
					</span>
					<ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40" />
				</button>
			</PopoverTrigger>
			<PopoverContent className={cn(popoverWidth, "p-0")} align="start">
				<Command>
					<CommandInput placeholder={t("common.search", "Search…")} />
					<CommandList>
						<CommandEmpty>{t("common.no_results", "No results.")}</CommandEmpty>
						<CommandGroup>
							{options.map((opt) => (
								<CommandItem
									key={opt.value}
									value={opt.label}
									onSelect={() => {
										onValueChange(opt.value);
										setOpen(false);
									}}
									className="gap-2"
								>
									<Check
										className={cn(
											"h-4 w-4 shrink-0 transition-opacity",
											value === opt.value
												? "text-primary opacity-100"
												: "opacity-0",
										)}
									/>
									<span className="truncate">{opt.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// ─── Combobox ─────────────────────────────────────────────────────────────────

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
						{selected
							? selected.label
							: (placeholder ?? t("common.select", "Select…"))}
					</span>
					<div className="flex shrink-0 items-center gap-1">
						{clearable && selected && (
							<X
								className="h-3.5 w-3.5 opacity-50 transition-opacity hover:opacity-100"
								onClick={handleClear}
							/>
						)}
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-full min-w-[var(--radix-popover-trigger-width)] p-0"
				align="start"
			>
				<Command>
					{options.length > searchThreshold && (
						<CommandInput
							placeholder={searchPlaceholder ?? t("common.search", "Search…")}
						/>
					)}
					<CommandList>
						<CommandEmpty>
							{emptyText ?? t("common.no_results", "No results.")}
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
											value === option.value
												? "text-primary opacity-100"
												: "opacity-0",
										)}
									/>
									<div className="flex min-w-0 flex-col">
										<span className="truncate">{option.label}</span>
										{option.description && (
											<span className="truncate text-muted-foreground text-xs">
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
