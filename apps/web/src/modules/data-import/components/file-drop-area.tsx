import { FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Drop zone / picker for one .xlsx workbook. */
export function FileDropArea({
	onFile,
	isBusy,
	fileName,
}: {
	onFile: (file: File) => void;
	isBusy: boolean;
	fileName: string | null;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const pick = (file?: File) => file && !isBusy && onFile(file);

	return (
		<button
			type="button"
			onClick={() => inputRef.current?.click()}
			onDragOver={(e) => {
				e.preventDefault();
				setDragging(true);
			}}
			onDragLeave={() => setDragging(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDragging(false);
				pick(e.dataTransfer.files[0]);
			}}
			disabled={isBusy}
			className={cn(
				"flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
				dragging
					? "border-primary bg-primary/5"
					: "hover:border-primary/50 hover:bg-muted/40",
			)}
		>
			{isBusy ? (
				<>
					<Spinner className="h-6 w-6" />
					<span className="font-medium text-sm">
						Vérification de {fileName}…
					</span>
				</>
			) : (
				<>
					{fileName ? (
						<FileSpreadsheet className="h-8 w-8 text-primary" />
					) : (
						<Upload className="h-8 w-8 text-muted-foreground" />
					)}
					<span className="font-medium text-sm">
						Glissez le fichier rempli ici, ou cliquez pour le choisir
					</span>
					<span className="text-muted-foreground text-xs">
						Excel (.xlsx), 10 Mo maximum
					</span>
				</>
			)}
			<input
				ref={inputRef}
				type="file"
				accept=".xlsx"
				className="hidden"
				onChange={(e) => {
					pick(e.target.files?.[0]);
					e.target.value = "";
				}}
			/>
		</button>
	);
}
