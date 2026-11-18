import type React from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface Props {
	title: React.ReactNode;
	description?: React.ReactNode;
	/** Rendered HTML document, shown in a sandboxed iframe. */
	html: string;
	/** Lays the frame out as an A4 page (scrolls when the dialog is smaller). */
	paper?: boolean;
}

/** Full-height preview of a rendered HTML document. */
export const DocumentPreviewDialog = createCallable<Props>(
	({ call, title, description, html, paper }) => {
		const { t } = useTranslation();
		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
				<DialogContent className="flex h-[90vh] flex-col sm:max-w-5xl">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
					<div className="mx-6 mb-6 flex-1 overflow-auto rounded border bg-white">
						<iframe
							title={t("common.documentPreview.frameTitle")}
							className="block h-full w-full bg-white"
							style={
								paper ? { minWidth: "210mm", minHeight: "297mm" } : undefined
							}
							srcDoc={html}
							sandbox="allow-same-origin"
						/>
					</div>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
