import { GraduationCap, Loader2 } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";

const LoadingScreen: React.FC = () => {
	const { t } = useTranslation();

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
			<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
				<GraduationCap className="h-7 w-7 text-primary-foreground" />
			</div>
			<div className="flex flex-col items-center gap-3">
				<Loader2 className="h-5 w-5 animate-spin text-primary" />
				<p className="font-medium text-muted-foreground text-sm">
					{t("common.loading")}
				</p>
			</div>
		</div>
	);
};

export default LoadingScreen;
