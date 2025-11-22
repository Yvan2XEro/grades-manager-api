import type React from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface FormModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

const FormModal: React.FC<FormModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
};

export default FormModal;
