import { CircleAlert, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface PromoteNoTargetFoundProps {
	/** `next`: next-level class for promoted students; `same`: for repeaters. */
	level: "next" | "same";
	programName?: string;
	levelName?: string;
	yearName?: string;
	creating: boolean;
	onCreateClass: () => void;
}

/** Explains that the destination class does not exist yet and creates it. */
export function PromoteNoTargetFound({
	level,
	programName,
	levelName,
	yearName,
	creating,
	onCreateClass,
}: PromoteNoTargetFoundProps) {
	const { t } = useTranslation();
	const keys =
		level === "same"
			? ({
					title: "admin.deliberations.promote.noRepeatTargetFound.title",
					description:
						"admin.deliberations.promote.noRepeatTargetFound.description",
				} as const)
			: ({
					title: "admin.deliberations.promote.noTargetFound.title",
					description: "admin.deliberations.promote.noTargetFound.description",
				} as const);
	return (
		<div className="space-y-3 rounded-lg border border-dashed p-4">
			<div className="flex items-center gap-2 font-medium text-foreground text-sm">
				<CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
				{t(keys.title)}
			</div>
			<p className="text-muted-foreground text-xs">
				{t(keys.description, {
					program: programName ?? "—",
					level: levelName ?? "—",
					year: yearName ?? "—",
				})}
			</p>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onCreateClass}
				disabled={creating}
			>
				{creating ? (
					<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
				) : (
					<Plus className="mr-1.5 h-3.5 w-3.5" />
				)}
				{t("admin.deliberations.promote.noTargetFound.create", {
					name: `${programName ?? ""} – ${levelName ?? ""}`,
				})}
			</Button>
		</div>
	);
}
