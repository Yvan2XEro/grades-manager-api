import { KeyRound, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function PreferencesTab() {
	const { t, i18n } = useTranslation();

	const languageOptions = [
		{ value: "en", label: t("settings.preferences.languages.en") },
		{ value: "fr", label: t("settings.preferences.languages.fr") },
	];

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Languages className="h-4 w-4 text-primary" />
						{t("settings.preferences.title")}
					</CardTitle>
					<CardDescription>
						{t("settings.preferences.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:max-w-sm">
						<div className="space-y-2">
							<label className="font-medium text-sm">
								{t("settings.preferences.languageLabel")}
							</label>
							<Select
								value={i18n.language}
								onValueChange={(value) => {
									i18n.changeLanguage(value);
									localStorage.setItem("lng", value);
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{languageOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Separator />
						<div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
							<KeyRound className="mt-0.5 h-4 w-4" />
							{t("settings.preferences.languageHint")}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
