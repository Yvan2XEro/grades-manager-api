import { ArrowLeft, Download } from "lucide-react";
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
	return (
		<div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-7rem)] flex-col space-y-4 p-4 md:p-6 lg:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft className="mr-1 h-4 w-4" />
						Retour
					</Button>
					<div>
						<h1 className="font-bold text-foreground text-xl">
							Aperçu du document
						</h1>
						<p className="text-muted-foreground text-xs">{subtitle}</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={() =>
						downloadBlob(
							new Blob([html], { type: "text/html" }),
							"apercu-document.html",
						)
					}
				>
					<Download className="mr-1 h-4 w-4" />
					Télécharger HTML
				</Button>
			</div>
			<div className="min-h-0 flex-1 overflow-hidden rounded border">
				<iframe
					title="Aperçu"
					className="h-full w-full bg-white"
					srcDoc={html}
				/>
			</div>
		</div>
	);
}
