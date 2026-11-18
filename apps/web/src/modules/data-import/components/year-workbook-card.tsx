import { useMutation } from "@tanstack/react-query";
import { FileStack, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { G, stepLabel } from "../services/import-steps";
import { FileDropArea } from "./file-drop-area";

/** The single workbook of a year, once uploaded: which steps it covers. */
export interface YearWorkbook {
	fileId: string;
	name: string;
	steps: string[];
}

const readAsBase64 = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

/**
 * Lets the client drop one workbook holding all the sheets of the year; each
 * step then offers to check its own sheets from it, in order.
 */
export function YearWorkbookCard({
	academicYearId,
	workbook,
	onChange,
}: {
	academicYearId: string;
	workbook: YearWorkbook | null;
	onChange: (workbook: YearWorkbook | null) => void;
}) {
	const { t } = useTranslation();
	const upload = useMutation({
		mutationFn: async (file: File) => {
			const { fileId } = await trpcClient.dataImport.upload.mutate({
				name: file.name,
				data: await readAsBase64(file),
			});
			const steps = await trpcClient.dataImport.workbookSteps.query({
				fileId,
				academicYearId,
			});
			return { fileId, name: file.name, steps };
		},
		onSuccess: (result) => {
			if (!result.steps.length) toast.error(t(`${G}workbook.nothing`));
			onChange(result.steps.length ? result : null);
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<FileStack className="h-4 w-4" />
					{t(`${G}workbook.title`)}
				</CardTitle>
				<p className="text-muted-foreground text-sm">
					{t(`${G}workbook.text`)}
				</p>
			</CardHeader>
			<CardContent>
				{workbook ? (
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<span className="font-medium">{workbook.name}</span>
						<span className="text-muted-foreground">
							{t(`${G}workbook.covers`, {
								steps: workbook.steps
									.map((key) => stepLabel(key, t))
									.join(", "),
							})}
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="ml-auto"
							onClick={() => onChange(null)}
						>
							<X className="mr-1 h-4 w-4" />
							{t(`${G}workbook.forget`)}
						</Button>
					</div>
				) : (
					<FileDropArea
						onFile={(file) => upload.mutate(file)}
						isBusy={upload.isPending}
						fileName={null}
					/>
				)}
			</CardContent>
		</Card>
	);
}
