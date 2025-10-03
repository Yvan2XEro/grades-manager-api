import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const confirmLabel = confirmText ?? t('common.actions.confirm');
  const cancelLabel = cancelText ?? t('common.actions.cancel');

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X className="h-4 w-4" />
        </button>
        
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
        
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost" disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-error"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
