import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRegistrationFormatPreview } from "../hooks/use-registration-format-preview";
import type { DraftFormat, PreviewProfile } from "../types";

/** Tests the draft pattern on a class and optional student info. */
export function FormatPreviewCard({ draft }: { draft: DraftFormat }) {
	const { t } = useTranslation();
	const preview = useRegistrationFormatPreview(draft);

	const profileFields: { key: keyof PreviewProfile; label: string }[] = [
		{
			key: "firstName",
			label: t("admin.registrationNumbers.preview.firstName", {
				defaultValue: "First name",
			}),
		},
		{
			key: "lastName",
			label: t("admin.registrationNumbers.preview.lastName", {
				defaultValue: "Last name",
			}),
		},
		{
			key: "nationality",
			label: t("admin.registrationNumbers.preview.nationality", {
				defaultValue: "Nationality",
			}),
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("admin.registrationNumbers.preview.title", {
						defaultValue: "Preview",
					})}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-xs">
					{t("admin.registrationNumbers.preview.subtitle", {
						defaultValue:
							"Select a class and optional student info to test the pattern.",
					})}
				</p>
				<div className="space-y-2">
					<Label>
						{t("admin.registrationNumbers.preview.class", {
							defaultValue: "Class",
						})}
					</Label>
					<Select value={preview.classId} onValueChange={preview.setClassId}>
						<SelectTrigger>
							<SelectValue
								placeholder={t(
									"admin.registrationNumbers.preview.classPlaceholder",
									{ defaultValue: "Select class" },
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{preview.classOptions.map((klass) => (
								<SelectItem key={klass.id} value={klass.id}>
									{klass.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{profileFields.map(({ key, label }) => (
					<div key={key} className="space-y-2">
						<Label>{label}</Label>
						<Input
							value={preview.profile[key]}
							onChange={(event) =>
								preview.setProfileField(key, event.target.value)
							}
						/>
					</div>
				))}
				<Button
					type="button"
					variant="secondary"
					onClick={preview.run}
					disabled={
						preview.isRunning ||
						!preview.classId ||
						draft.definition.segments.length === 0
					}
				>
					{t("admin.registrationNumbers.preview.run", {
						defaultValue: "Generate preview",
					})}
				</Button>
				{preview.result && (
					<div className="rounded-lg border bg-card p-4">
						<p className="font-medium text-foreground text-sm">
							{t("admin.registrationNumbers.preview.result", {
								defaultValue: "Preview result",
							})}
						</p>
						<p className="font-semibold text-2xl text-foreground">
							{preview.result}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
