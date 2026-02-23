import { PhoneInput as RIPPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
	value?: string;
	onChange?: (value: string) => void;
	className?: string;
	disabled?: boolean;
	placeholder?: string;
}

export function PhoneInput({
	value,
	onChange,
	className,
	disabled,
	placeholder,
}: PhoneInputProps) {
	return (
		<RIPPhoneInput
			defaultCountry="cm"
			value={value}
			onChange={(phone) => onChange?.(phone)}
			disabled={disabled}
			placeholder={placeholder}
			inputClassName={cn(
				"!h-10 !w-full !rounded-r-md !border-input !bg-transparent !px-3 !py-2 !text-base !shadow-xs !outline-none !transition-all !duration-200 md:!text-sm !placeholder:text-muted-foreground/70 !placeholder:italic",
				"focus:!border-ring focus:!ring-[3px] focus:!ring-ring/50",
				"disabled:!pointer-events-none disabled:!cursor-not-allowed disabled:!opacity-50",
			)}
			countrySelectorStyleProps={{
				buttonClassName: cn(
					"!h-10 !rounded-l-md !border-input !bg-transparent !px-2 !shadow-xs",
					"hover:!bg-accent",
					disabled && "!pointer-events-none !cursor-not-allowed !opacity-50",
				),
			}}
			className={cn("flex", className)}
		/>
	);
}
