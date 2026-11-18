import { Search } from "lucide-react";

/** Search box of the approval screens. */
export function ExamSearchInput({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}) {
	return (
		<div className="relative min-w-[200px] flex-1">
			<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>
	);
}
