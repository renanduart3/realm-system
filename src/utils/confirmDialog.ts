interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

let dialogRoot: HTMLDivElement | null = null;

export const showConfirmDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!dialogRoot) {
      dialogRoot = document.createElement('div');
      document.body.appendChild(dialogRoot);
    }

    const cleanup = () => {
      if (dialogRoot) {
        document.body.removeChild(dialogRoot);
        dialogRoot = null;
      }
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    dialog.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 class="text-lg font-semibold mb-4 ${
          options.type === 'danger' ? 'text-red-600' :
          options.type === 'warning' ? 'text-amber-600' :
          'text-blue-600'
        }">${options.title}</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">${options.message}</p>
        <div class="flex justify-end space-x-4">
          <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            ${options.cancelText || 'Cancelar'}
          </button>
          <button class="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            options.type === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
            options.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' :
            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }">
            ${options.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    `;

    const confirmButton = dialog.querySelector('button:last-child');
    const cancelButton = dialog.querySelector('button:first-child');

    confirmButton?.addEventListener('click', handleConfirm);
    cancelButton?.addEventListener('click', handleCancel);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) handleCancel();
    });

    dialogRoot.appendChild(dialog);
  });
};

// Em qualquer componente
const handleDangerousAction = async () => {
  const confirmed = await showConfirmDialog({
    title: 'Confirmação',
    message: 'Tem certeza que deseja realizar esta ação?',
    confirmText: 'Sim, continuar',
    cancelText: 'Cancelar',
    type: 'danger'
  });

  if (confirmed) {
    // Executar ação
  }
}; 