import { CircleAlert, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface PromoteNoTargetFoundProps {
	programName?: string;
	levelCode?: string;
	levelOrderIndex?: number;
	onCreateClass: () => void;
}

/** Explains why no destination class matched and offers to create it. */
export function PromoteNoTargetFound({
	programName,
	levelCode,
	levelOrderIndex,
	onCreateClass,
}: PromoteNoTargetFoundProps) {
	const { t } = useTranslation();
	return (
		<div className="space-y-3 rounded-lg border border-dashed p-4">
			<div className="flex items-center gap-2 font-medium text-foreground text-sm">
				<CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
				{t("admin.deliberations.promote.noTargetFound.title")}
			</div>
			<div className="space-y-1.5 text-muted-foreground text-xs">
				<p>{t("admin.deliberations.promote.noTargetFound.searched")}</p>
				<ul className="ml-4 list-disc space-y-1">
					<li>
						{t("admin.deliberations.promote.noTargetFound.criteriaProgram", {
							program: programName ?? "—",
						})}
					</li>
					<li>
						{t("admin.deliberations.promote.noTargetFound.criteriaLevel", {
							level: levelCode ?? "—",
							nextIndex: (levelOrderIndex ?? 0) + 1,
						})}
					</li>
					<li>{t("admin.deliberations.promote.noTargetFound.criteriaYear")}</li>
				</ul>
			</div>
			<p className="text-muted-foreground text-xs">
				{t("admin.deliberations.promote.noTargetFound.fix", {
					program: programName ?? "—",
					level: levelCode ?? "—",
				})}
			</p>
			<Button type="button" variant="outline" size="sm" onClick={onCreateClass}>
				<Plus className="mr-1.5 h-3.5 w-3.5" />
				{t("admin.classes.actions.add")}
			</Button>
		</div>
	);
}
