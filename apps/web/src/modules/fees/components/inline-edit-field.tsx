import { Check, Pencil, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Value with a pencil (shown on hover of a `group` parent) that turns into an
 * input with confirm / cancel buttons; Enter commits and Escape cancels.
 */
export function InlineEditField({
	isEditing,
	displayValue,
	value,
	inputType = "text",
	pending,
	onStart,
	onChange,
	onCommit,
	onCancel,
}: {
	isEditing: boolean;
	displayValue: ReactNode;
	value: string;
	inputType?: "text" | "number";
	pending?: boolean;
	onStart: () => void;
	onChange: (value: string) => void;
	onCommit: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex items-center gap-1">
			{isEditing ? (
				<>
					<Input
						autoFocus
						type={inputType}
						min={inputType === "number" ? 0 : undefined}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="h-7 text-sm"
						onKeyDown={(e) => {
							if (e.key === "Enter") onCommit();
							if (e.key === "Escape") onCancel();
						}}
					/>
					<Button
						size="sm"
						variant="ghost"
						disabled={pending}
						onClick={onCommit}
						className="h-7 w-7 p-0"
					>
						<Check className="h-3.5 w-3.5 text-green-600" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={onCancel}
						className="h-7 w-7 p-0"
					>
						<X className="h-3.5 w-3.5" />
					</Button>
				</>
			) : (
				<>
					<span>{displayValue}</span>
					<Button
						size="sm"
						variant="ghost"
						onClick={onStart}
						className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<Pencil className="h-3 w-3 text-muted-foreground" />
					</Button>
				</>
			)}
		</div>
	);
}
