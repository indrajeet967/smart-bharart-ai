import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary', 'danger', 'saffron'
  isLoading = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5 py-2">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 shrink-0">
          <AlertTriangle size={22} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
