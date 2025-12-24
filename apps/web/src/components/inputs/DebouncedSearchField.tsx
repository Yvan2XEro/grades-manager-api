import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DebouncedSearchFieldProps = {
	value: string;
	onChange: (value: string) => void;
	delay?: number;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
};

export function DebouncedSearchField({
	value,
	onChange,
	delay = 300,
	placeholder,
	className,
	disabled,
}: DebouncedSearchFieldProps) {
	const [internalValue, setInternalValue] = useState(value);

	useEffect(() => {
		setInternalValue(value);
	}, [value]);

	const debouncedValue = useMemo(() => internalValue, [internalValue]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (debouncedValue !== value) {
				onChange(debouncedValue);
			}
		}, delay);
		return () => clearTimeout(timer);
	}, [debouncedValue, delay, onChange, value]);

	const handleClear = () => {
		setInternalValue("");
		onChange("");
	};

	return (
		<div className={`relative ${className ?? ""}`}>
			<Input
				type="search"
				value={internalValue}
				onChange={(event) => setInternalValue(event.target.value)}
				placeholder={placeholder}
				disabled={disabled}
			/>
			{internalValue ? (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="absolute right-1 top-1 h-7 w-7"
					onClick={handleClear}
					disabled={disabled}
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Clear search</span>
				</Button>
			) : null}
		</div>
	);
}
