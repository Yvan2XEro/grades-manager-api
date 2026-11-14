import { FileText, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Asks whether to resume the saved draft or start a new application. */
export function ApplicationDraftPrompt({
	onResume: resumeDraft,
	onDiscard: clearDraft,
}: {
	onResume: () => void;
	onDiscard: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4">
			<Card className="w-full max-w-md">
				<CardContent className="space-y-6 pt-8 pb-8">
					<div className="space-y-2 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
							<FileText className="size-6 text-primary" />
						</div>
						<h2 className="font-semibold text-xl">
							{t("admissions.wizard.draftNotice")}
						</h2>
						<p className="text-muted-foreground text-sm">
							Reprendre là où vous en étiez ou recommencer depuis le début.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<Button onClick={resumeDraft} size="lg">
							{t("admissions.wizard.resumeDraft")}
						</Button>
						<Button variant="outline" onClick={clearDraft} size="lg">
							<RotateCcw className="mr-2 size-4" />
							{t("admissions.wizard.newForm")}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
