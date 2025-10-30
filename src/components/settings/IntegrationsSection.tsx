import React from 'react';
import { Loader2, Cloud, CloudCog } from 'lucide-react';

interface Props {
  isPremium: boolean;
  isSyncing: boolean;
  isOAuthSyncing: boolean;
  onSync: () => void;
  onOAuthSync: () => void;
  message?: { type: 'success' | 'error'; text: string } | null;
  showBackup?: boolean;
  onExport?: () => void;
  onImport?: (file?: File) => void;
  onDriveBackup?: () => void;
  isExporting?: boolean;
  isImporting?: boolean;
  isDriveBackup?: boolean;
  canDriveBackup?: boolean;
}

const IntegrationsSection: React.FC<Props> = ({ isPremium, isSyncing, isOAuthSyncing, onSync, onOAuthSync, message, showBackup, onExport, onImport, onDriveBackup, isExporting, isImporting, isDriveBackup, canDriveBackup }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integrações</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CloudCog className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Google Sheets</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sincronize seus dados com o Google Sheets</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSync}
              disabled={isSyncing || !isPremium}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isPremium ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSyncing ? (<><Loader2 className="w-4 h-4 animate-spin" />Sincronizando...</>) : (<><Cloud className="w-4 h-4" />Sincronizar</>)}
            </button>
            <button
              onClick={onOAuthSync}
              disabled={isOAuthSyncing || !isPremium}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isPremium ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isOAuthSyncing ? (<><Loader2 className="w-4 h-4 animate-spin" />OAuth...</>) : (<><Cloud className="w-4 h-4" />Sincronizar (OAuth)</>)}
            </button>
          </div>
        </div>
        {message && (
          <div className={`mt-2 p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
      </div>
      {showBackup && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Backup e Restauração</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onExport} disabled={!isPremium || !!isExporting} className={`px-4 py-2 rounded-lg font-medium ${isPremium ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>{isExporting ? 'Exportando...' : (canDriveBackup ? 'Exportar Backup (.db)' : 'Exportar Backup (JSON)')}</button>
            <label className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${isPremium ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
              {isImporting ? 'Importando...' : 'Importar Backup (JSON)'}
              <input type="file" accept="application/json" className="hidden" disabled={!isPremium || !!isImporting} onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport?.(f); (e.currentTarget as HTMLInputElement).value=''; }} />
            </label>
            <button onClick={onDriveBackup} disabled={!isPremium || !!isDriveBackup || !canDriveBackup} className={`px-4 py-2 rounded-lg font-medium ${isPremium && canDriveBackup ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>{isDriveBackup ? 'Enviando...' : 'Backup no Google Drive'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsSection;
