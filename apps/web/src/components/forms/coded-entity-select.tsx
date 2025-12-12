import { Check, ChevronsUpDown, Loader2, SearchIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

/**
 * Generic coded entity type
 */
export interface CodedEntity {
	code: string;
	name: string;
	[key: string]: unknown;
}

/**
 * Props for CodedEntitySelect component
 */
export interface CodedEntitySelectProps<T extends CodedEntity> {
	// Data fetching
	items: T[];
	isLoading?: boolean;
	onSearch?: (query: string) => void;

	// Current value
	value?: string | null;
	onChange: (code: string | null) => void;

	// Display customization
	label?: string;
	placeholder?: string;
	emptyMessage?: string;
	searchPlaceholder?: string;
	error?: string;
	icon?: React.ReactNode;
	getItemIcon?: (item: T) => React.ReactNode;
	getItemSubtitle?: (item: T) => string;
	getItemBadge?: (item: T) => string;

	// Behavior
	disabled?: boolean;
	required?: boolean;
	allowClear?: boolean;
	searchMode?: "local" | "server" | "hybrid";
	minSearchLength?: number;
	debounceMs?: number;

	// Accessibility
	id?: string;
	name?: string;
}

/**
 * Reusable select component for entities with code-based references
 * Supports debounced search, local/server filtering, and i18n
 */
export function CodedEntitySelect<T extends CodedEntity>({
	items,
	isLoading = false,
	onSearch,
	value,
	onChange,
	label,
	placeholder,
	emptyMessage,
	searchPlaceholder,
	error,
	icon,
	getItemIcon,
	getItemSubtitle,
	getItemBadge,
	disabled = false,
	required = false,
	allowClear = true,
	searchMode = "hybrid",
	minSearchLength = 1,
	debounceMs = 300,
	id,
	name,
}: CodedEntitySelectProps<T>) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearch = useDebounce(searchQuery, debounceMs);

	// Trigger server search when debounced value changes
	const handleServerSearch = useCallback(() => {
		if (
			onSearch &&
			(searchMode === "server" || searchMode === "hybrid") &&
			debouncedSearch.length >= minSearchLength
		) {
			onSearch(debouncedSearch);
		}
	}, [onSearch, searchMode, debouncedSearch, minSearchLength]);

	// Trigger server search on debounced value change
	useMemo(() => {
		handleServerSearch();
	}, [handleServerSearch]);

	// Filter items locally based on search query
	const filteredItems = useMemo(() => {
		if (!searchQuery || searchMode === "server") {
			return items;
		}

		const query = searchQuery.toLowerCase().trim();
		return items.filter(
			(item) =>
				item.code.toLowerCase().includes(query) ||
				item.name.toLowerCase().includes(query),
		);
	}, [items, searchQuery, searchMode]);

	// Find selected item
	const selectedItem = useMemo(
		() => items.find((item) => item.code === value),
		[items, value],
	);

	// Handle selection
	const handleSelect = (code: string) => {
		if (code === value) {
			// Deselect if clicking the same item
			if (allowClear) {
				onChange(null);
			}
		} else {
			onChange(code);
		}
		setOpen(false);
		setSearchQuery("");
	};

	// Handle clear
	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(null);
		setSearchQuery("");
	};

	// Get display text for trigger button
	const displayText = selectedItem
		? `${selectedItem.code} - ${selectedItem.name}`
		: placeholder || t("components.codedEntitySelect.placeholder");

	return (
		<div className="flex flex-col gap-2">
			{label && (
				<Label htmlFor={id} className={cn(required && "after:content-['*']")}>
					{label}
				</Label>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-label={label}
						disabled={disabled}
						className={cn(
							"w-full justify-between",
							!value && "text-muted-foreground",
							error && "border-destructive",
						)}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							{icon && <span className="shrink-0">{icon}</span>}
							{selectedItem && getItemIcon && (
								<span className="shrink-0">{getItemIcon(selectedItem)}</span>
							)}
							<span className="truncate">{displayText}</span>
						</div>
						<div className="flex items-center gap-1 shrink-0">
							{value && allowClear && !disabled && (
								<XIcon
									className="h-4 w-4 opacity-50 hover:opacity-100"
									onClick={handleClear}
								/>
							)}
							<ChevronsUpDown className="h-4 w-4 opacity-50" />
						</div>
					</Button>
				</PopoverTrigger>

				<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
					<Command shouldFilter={false}>
						<div className="flex items-center border-b px-3">
							<SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
							<input
								className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
								placeholder={
									searchPlaceholder ||
									t("components.codedEntitySelect.searchPlaceholder")
								}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<CommandList>
							{isLoading && (
								<div className="flex items-center justify-center py-6">
									<Spinner className="h-6 w-6" />
								</div>
							)}

							{!isLoading && filteredItems.length === 0 && (
								<CommandEmpty>
									{emptyMessage ||
										t("components.codedEntitySelect.noResults")}
								</CommandEmpty>
							)}

							{!isLoading && filteredItems.length > 0 && (
								<CommandGroup>
									{searchQuery && (
										<div className="px-2 py-1.5 text-xs text-muted-foreground">
											{t("components.codedEntitySelect.resultsCount", {
												count: filteredItems.length,
											})}
										</div>
									)}
									{filteredItems.map((item) => (
										<CommandItem
											key={item.code}
											value={item.code}
											onSelect={handleSelect}
											className="flex items-center gap-2"
										>
											<Check
												className={cn(
													"h-4 w-4 shrink-0",
													value === item.code ? "opacity-100" : "opacity-0",
												)}
											/>
											{getItemIcon && (
												<span className="shrink-0">{getItemIcon(item)}</span>
											)}
											<div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
												<div className="flex items-center gap-2">
													<span className="font-mono text-xs font-semibold">
														{item.code}
													</span>
													{getItemBadge && (
														<Badge variant="secondary" className="text-xs">
															{getItemBadge(item)}
														</Badge>
													)}
												</div>
												<span className="text-sm truncate">{item.name}</span>
												{getItemSubtitle && (
													<span className="text-xs text-muted-foreground truncate">
														{getItemSubtitle(item)}
													</span>
												)}
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<input type="hidden" name={name} value={value || ""} />
		</div>
	);
}
