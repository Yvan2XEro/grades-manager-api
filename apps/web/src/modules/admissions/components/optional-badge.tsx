import { Badge } from "@/components/ui/badge";

/** Small "opt." marker next to the label of an optional field. */
export function OptionalBadge({ label }: { label: string }) {
	return (
		<Badge variant="secondary" className="px-1.5 py-0 font-normal text-[10px]">
			{label}
		</Badge>
	);
}
