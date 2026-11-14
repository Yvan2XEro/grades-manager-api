import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DraftFormat } from "../types";

interface Props {
	draft: DraftFormat;
	onChange: (patch: Partial<DraftFormat>) => void;
}

/** Name, description and "activate on save" switch of a format. */
export function FormatGeneralCard({ draft, onChange }: Props) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardContent className="space-y-4 pt-6">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>
							{t("admin.registrationNumbers.form.name", {
								defaultValue: "Format name",
							})}
						</Label>
						<Input
							value={draft.name}
							onChange={(event) => onChange({ name: event.target.value })}
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border px-4 py-2">
						<div>
							<p className="font-medium text-foreground text-sm">
								{t("admin.registrationNumbers.form.activeLabel", {
									defaultValue: "Activate on save",
								})}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("admin.registrationNumbers.form.activeHelp", {
									defaultValue: "Switching on will deactivate other templates.",
								})}
							</p>
						</div>
						<Switch
							checked={draft.isActive}
							onCheckedChange={(checked) => onChange({ isActive: checked })}
						/>
					</div>
				</div>
				<div className="space-y-2">
					<Label>
						{t("admin.registrationNumbers.form.description", {
							defaultValue: "Description",
						})}
					</Label>
					<Textarea
						value={draft.description ?? ""}
						rows={3}
						onChange={(event) => onChange({ description: event.target.value })}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
