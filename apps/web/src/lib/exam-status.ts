import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
	draft: "secondary",
	open: "default",
	locked: "outline",
	submitted: "warning",
	approved: "success",
	rejected: "destructive",
	scheduled: "secondary",
	closed: "secondary",
	signed: "success",
};

export function examStatusVariant(status: string): BadgeVariant {
	return STATUS_VARIANT_MAP[status] ?? "secondary";
}

export function deliberationStatusVariant(status: string): BadgeVariant {
	const map: Record<string, BadgeVariant> = {
		draft: "secondary",
		open: "default",
		closed: "secondary",
		signed: "success",
	};
	return map[status] ?? "secondary";
}
