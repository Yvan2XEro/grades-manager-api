import { Loader2 } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";

const LoadingScreen: React.FC = () => {
	const { t } = useTranslation();

	return (
		<div className="flex h-screen w-full items-center justify-center bg-primary-50">
			<div className="flex flex-col items-center space-y-4">
				<Loader2 className="h-12 w-12 animate-spin text-primary-700" />
				<h2 className="font-semibold text-primary-800 text-xl">
					{t("common.loading")}
				</h2>
			</div>
		</div>
	);
};

export default LoadingScreen;
