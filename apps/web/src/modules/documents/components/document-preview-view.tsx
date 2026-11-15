import { ArrowLeft, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";

/** Full-page preview of a rendered document (HTML in an iframe). */
export function DocumentPreviewView({
	html,
	subtitle,
	onBack,
}: {
	html: string;
	subtitle: string;
	onBack: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-7rem)] flex-col space-y-4 p-4 md:p-6 lg:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft className="mr-1 h-4 w-4" />
						{t("common.actions.back")}
					</Button>
					<div>
						<h1 className="font-bold text-foreground text-xl">
							{t("admin.documents.preview.title")}
						</h1>
						<p className="text-muted-foreground text-xs">{subtitle}</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={() =>
						downloadBlob(
							new Blob([html], { type: "text/html" }),
							`${t("admin.documents.preview.fileName")}.html`,
						)
					}
				>
					<Download className="mr-1 h-4 w-4" />
					{t("admin.documents.preview.downloadHtml")}
				</Button>
			</div>
			<div className="min-h-0 flex-1 overflow-hidden rounded border">
				<iframe
					title={t("admin.documents.preview.frameTitle")}
					className="h-full w-full bg-white"
					srcDoc={html}
				/>
			</div>
		</div>
	);
}
