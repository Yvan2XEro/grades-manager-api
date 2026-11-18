import { CircleAlert, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface PromoteNoTargetFoundProps {
	programName?: string;
	nextLevelName?: string;
	yearName?: string;
	creating: boolean;
	onCreateClass: () => void;
}

/** Explains that the next-level class does not exist yet and creates it. */
export function PromoteNoTargetFound({
	programName,
	nextLevelName,
	yearName,
	creating,
	onCreateClass,
}: PromoteNoTargetFoundProps) {
	const { t } = useTranslation();
	return (
		<div className="space-y-3 rounded-lg border border-dashed p-4">
			<div className="flex items-center gap-2 font-medium text-foreground text-sm">
				<CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
				{t("admin.deliberations.promote.noTargetFound.title")}
			</div>
			<p className="text-muted-foreground text-xs">
				{t("admin.deliberations.promote.noTargetFound.description", {
					program: programName ?? "—",
					level: nextLevelName ?? "—",
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
					name: `${programName ?? ""} – ${nextLevelName ?? ""}`,
				})}
			</Button>
		</div>
	);
}
