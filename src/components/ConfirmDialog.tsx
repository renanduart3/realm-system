import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 
            type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : 
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              type === 'danger' ? 'text-red-600 dark:text-red-400' : 
              type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
              'text-blue-600 dark:text-blue-400'
            }`} />
          </div>
          <h3 className={`text-lg font-semibold ${
            type === 'danger' ? 'text-red-600 dark:text-red-400' : 
            type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
            'text-blue-600 dark:text-blue-400'
          }`}>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 
              type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}