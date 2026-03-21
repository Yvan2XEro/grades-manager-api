import { format, isValid, parse } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	value: string; // YYYY-MM-DD
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	startMonth?: Date;
	endMonth?: Date;
}

export function DatePicker({
	value,
	onChange,
	placeholder,
	className,
	disabled,
	startMonth = new Date(1940, 0),
	endMonth = new Date(2035, 11),
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const { i18n } = useTranslation();

	const locale = i18n.language.startsWith("fr") ? fr : enUS;

	const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
	const selected = parsed && isValid(parsed) ? parsed : undefined;

	const handleSelect = (date: Date | undefined) => {
		if (date) {
			onChange(format(date, "yyyy-MM-dd"));
			setOpen(false);
		}
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-full justify-start gap-2 text-left font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
					<span className="flex-1 truncate">
						{selected
							? format(selected, "d MMMM yyyy", { locale })
							: (placeholder ?? t("components.datePicker.placeholder"))}
					</span>
					{selected && (
						<X
							className="h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
							onClick={handleClear}
						/>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={handleSelect}
					captionLayout="dropdown"
					defaultMonth={selected}
					locale={locale}
					startMonth={startMonth}
					endMonth={endMonth}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
