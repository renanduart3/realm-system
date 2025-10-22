import React from 'react';
import { Loader2, AlertTriangle, Cloud } from 'lucide-react';

interface Props {
  onReset: () => void;
  isResetting: boolean;
  onExport: () => void;
  onImport: (file?: File) => void;
  onDriveBackup: () => void;
  isExporting: boolean;
  isImporting: boolean;
  isDriveBackup: boolean;
  canUsePremium: boolean;
  canDriveBackup: boolean;
}

const ResetSection: React.FC<Props> = ({
  onReset,
  isResetting,
  onExport,
  onImport,
  onDriveBackup,
  isExporting,
  isImporting,
  isDriveBackup,
  canUsePremium,
  canDriveBackup
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resetar Sistema</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aviso Importante</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta ação irá resetar todo o sistema para as configurações iniciais. Todos os dados serão perdidos.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onReset} disabled={isResetting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2">
            {isResetting ? (<><Loader2 className="w-4 h-4 animate-spin" />Resetando...</>) : (<><AlertTriangle className="w-4 h-4" />Resetar Sistema</>)}
          </button>
          <button onClick={onExport} disabled={isExporting || !canUsePremium} className={`px-4 py-2 rounded-lg font-medium ${canUsePremium ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
            {isExporting ? 'Exportando...' : 'Exportar Backup (JSON)'}
          </button>
          <label className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${canUsePremium ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
            {isImporting ? 'Importando...' : 'Importar Backup (JSON)'}
            <input type="file" accept="application/json" className="hidden" disabled={!canUsePremium || isImporting} onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); (e.currentTarget as HTMLInputElement).value=''; }} />
          </label>
          <button onClick={onDriveBackup} disabled={!canDriveBackup || isDriveBackup} className={`px-4 py-2 rounded-lg font-medium ${canDriveBackup ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
            {isDriveBackup ? 'Enviando...' : 'Backup no Google Drive'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetSection;

