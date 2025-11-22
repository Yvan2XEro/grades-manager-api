import type React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText,
	cancelText,
	isLoading = false,
}) => {
	if (!isOpen) return null;
	const { t } = useTranslation();
	const confirmLabel = confirmText ?? t("common.actions.confirm");
	const cancelLabel = cancelText ?? t("common.actions.cancel");

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">{message}</p>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="ghost" onClick={onClose} disabled={isLoading}>
						{cancelLabel}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
					>
						{isLoading ? <Spinner className="mr-2" /> : null}
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ConfirmModal;
