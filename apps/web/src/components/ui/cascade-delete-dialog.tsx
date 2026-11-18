import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./dialog";

interface ImpactItem {
	label: string;
	count: number;
}

interface CascadeDeleteDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	entityName: string;
	impacts: ImpactItem[];
	isLoading?: boolean;
}

export function CascadeDeleteDialog({
	open,
	onClose,
	onConfirm,
	entityName,
	impacts,
	isLoading,
}: CascadeDeleteDialogProps) {
	const { t } = useTranslation();
	const hasImpacts = impacts.some((i) => i.count > 0);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						{t("common.cascadeDelete.title", { name: entityName })}
					</DialogTitle>
				</DialogHeader>

				{hasImpacts && (
					<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
						<p className="mb-2 font-medium text-destructive text-sm">
							{t("common.cascadeDelete.willDelete")}
						</p>
						<ul className="space-y-1">
							{impacts
								.filter((i) => i.count > 0)
								.map((impact) => (
									<li
										key={impact.label}
										className="flex items-center gap-2 text-muted-foreground text-sm"
									>
										<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/60" />
										<span className="font-medium tabular-nums">
											{impact.count}
										</span>{" "}
										{impact.label}
									</li>
								))}
						</ul>
					</div>
				)}

				<p className="text-muted-foreground text-sm">
					{t("common.cascadeDelete.irreversible")}
				</p>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isLoading}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
					>
						{isLoading
							? t("common.cascadeDelete.deleting")
							: t("common.cascadeDelete.deleteAll")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
