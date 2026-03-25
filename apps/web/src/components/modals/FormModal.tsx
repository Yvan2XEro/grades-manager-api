import type React from "react";
import { useEffect, useRef } from "react";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface FormModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	maxWidth?: string;
	contentClassName?: string;
}

const FormModal: React.FC<FormModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
	maxWidth,
	contentClassName,
}) => {
	const prevOpen = useRef(false);
	useEffect(() => {
		if (isOpen && !prevOpen.current) sounds.open();
		else if (!isOpen && prevOpen.current) sounds.close();
		prevOpen.current = isOpen;
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={cn("overflow-hidden p-0 sm:max-w-2xl", maxWidth)}
			>
				{/* Gradient accent bar */}
				<div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/40" />
				<DialogHeader className="px-6 pt-5">
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div
					className={cn(
						"max-h-[calc(80vh-8rem)] overflow-y-auto px-6 pb-6",
						contentClassName,
					)}
				>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FormModal;
