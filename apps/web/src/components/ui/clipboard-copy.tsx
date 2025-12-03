import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type ClipboardCopyProps = {
	value: string;
	label?: string;
	className?: string;
};

export function ClipboardCopy({ value, label, className }: ClipboardCopyProps) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			toast.success(
				label
					? t("common.clipboard.copiedValue", {
							defaultValue: "{{value}} copied",
							value: label,
						})
					: t("common.clipboard.copied", {
							defaultValue: "Copied to clipboard",
						}),
			);
			setTimeout(() => setCopied(false), 1500);
		} catch (error) {
			toast.error(
				t("common.clipboard.failed", {
					defaultValue: "Unable to copy",
				}),
			);
		}
	};

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={handleCopy}
			className={cn(
				"inline-flex items-center gap-2 font-mono text-xs uppercase",
				className,
			)}
		>
			<span>{value}</span>
			{copied ? (
				<Check className="h-3.5 w-3.5" aria-hidden />
			) : (
				<Copy className="h-3.5 w-3.5" aria-hidden />
			)}
			<span className="sr-only">
				{t("common.clipboard.copyAria", {
					defaultValue: "Copy {{value}}",
					value: label ?? value,
				})}
			</span>
		</Button>
	);
}
