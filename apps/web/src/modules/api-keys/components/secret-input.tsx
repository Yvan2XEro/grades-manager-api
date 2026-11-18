import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Password-style input with a show/hide toggle. */
export function SecretInput({
	id,
	value,
	onChange,
	placeholder,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}) {
	const [visible, setVisible] = useState(false);
	return (
		<div className="relative">
			<Input
				id={id}
				type={visible ? "text" : "password"}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="pr-10"
			/>
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				className="-translate-y-1/2 absolute top-1/2 right-2.5 text-muted-foreground hover:text-foreground"
			>
				{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}
