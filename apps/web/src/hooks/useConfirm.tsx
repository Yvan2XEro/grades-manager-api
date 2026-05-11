import { useCallback, useState } from "react";
import ConfirmModal from "@/components/modals/ConfirmModal";

export interface ConfirmRequest {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void | Promise<void>;
}

interface InternalState extends ConfirmRequest {
	isLoading: boolean;
}

export function useConfirm() {
	const [state, setState] = useState<InternalState | null>(null);

	const confirm = useCallback((req: ConfirmRequest) => {
		setState({ ...req, isLoading: false });
	}, []);

	const close = useCallback(() => setState(null), []);

	const handleConfirm = useCallback(async () => {
		if (!state) return;
		setState({ ...state, isLoading: true });
		try {
			await state.onConfirm();
		} finally {
			setState(null);
		}
	}, [state]);

	const ConfirmDialog = useCallback(() => {
		return (
			<ConfirmModal
				isOpen={state !== null}
				onClose={close}
				onConfirm={handleConfirm}
				title={state?.title ?? ""}
				message={state?.message ?? ""}
				confirmText={state?.confirmText}
				cancelText={state?.cancelText}
				isLoading={state?.isLoading ?? false}
			/>
		);
	}, [state, close, handleConfirm]);

	return { confirm, ConfirmDialog };
}
