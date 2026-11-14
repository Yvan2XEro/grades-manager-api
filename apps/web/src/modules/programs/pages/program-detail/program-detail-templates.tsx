import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useProgramContext } from "../../hooks/use-program-context";
import {
	EXPORT_TEMPLATE_TYPE_LABELS,
	EXPORT_TEMPLATE_TYPES,
	useProgramExportTemplates,
} from "../../hooks/use-program-export-templates";

export default function ProgramDetailTemplates() {
	const { t } = useTranslation();
	const { programId } = useParams<{ programId: string }>();
	const { refetch } = useProgramContext();
	const { templates, selections, select, save } = useProgramExportTemplates(
		programId!,
		refetch,
	);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>
					{t("programs.hub.tabs.templates", {
						defaultValue: "Export Templates",
					})}
				</CardTitle>
				<Button onClick={() => save.mutate()} disabled={save.isPending}>
					{save.isPending
						? t("common.actions.saving", { defaultValue: "Saving..." })
						: t("common.actions.saveChanges")}
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{EXPORT_TEMPLATE_TYPES.map((type) => (
						<div key={type} className="flex items-center justify-between gap-4">
							<span className="min-w-0 shrink-0 font-medium text-sm">
								{EXPORT_TEMPLATE_TYPE_LABELS[type]}
							</span>
							<Select
								value={selections[type] ?? "none"}
								onValueChange={(val) => select(type, val)}
							>
								<SelectTrigger className="w-64">
									<SelectValue
										placeholder={t("common.none", { defaultValue: "None" })}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										{t("common.none", { defaultValue: "None" })}
									</SelectItem>
									{templates
										.filter((tpl) => tpl.type === type)
										.map((tpl) => (
											<SelectItem key={tpl.id} value={tpl.id}>
												{tpl.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
