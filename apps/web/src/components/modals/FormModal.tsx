import { X } from "lucide-react";
import type React from "react";

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
	if (!isOpen) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
				>
					<X className="h-4 w-4" />
				</button>

				<h3 className="mb-4 font-bold text-lg">{title}</h3>
				{children}
			</div>
		</div>
	);
};

export default FormModal;
