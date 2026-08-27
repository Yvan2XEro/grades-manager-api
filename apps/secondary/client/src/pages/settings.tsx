import { useTranslation } from "react-i18next";

export function Settings() {
	const { t, i18n } = useTranslation();

	const handleLanguageChange = (lang: string) => {
		i18n.changeLanguage(lang);
		localStorage.setItem("i18n_lang", lang);
	};

	return (
		<div className="max-w-2xl space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("settings.title", "Paramètres")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("settings.subtitle", "Configuration de l'application")}
				</p>
			</div>

			<div className="divide-y divide-border rounded-xl border border-border">
				<div className="px-5 py-4">
					<h2 className="mb-3 font-semibold text-foreground text-sm">
						{t("settings.language", "Langue de l'interface")}
					</h2>
					<div className="flex gap-2">
						{["fr", "en"].map((lang) => (
							<button
								key={lang}
								onClick={() => handleLanguageChange(lang)}
								className={`rounded-lg border px-4 py-1.5 font-medium text-sm transition-colors ${
									i18n.language === lang
										? "border-primary bg-primary text-primary-foreground"
										: "border-input bg-background text-foreground hover:bg-muted"
								}`}
							>
								{lang === "fr" ? "Français" : "English"}
							</button>
						))}
					</div>
				</div>

				<div className="px-5 py-4">
					<h2 className="mb-1 font-semibold text-foreground text-sm">
						{t("settings.institution", "Établissement")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							"settings.institution_desc",
							"Les informations de l'établissement sont gérées par l'administrateur système.",
						)}
					</p>
				</div>

				<div className="px-5 py-4">
					<h2 className="mb-1 font-semibold text-foreground text-sm">
						{t("settings.academic_year", "Année scolaire active")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							"settings.academic_year_desc",
							"Gérez les années scolaires depuis le menu principal.",
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
