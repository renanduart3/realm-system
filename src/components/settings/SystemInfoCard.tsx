import React from 'react';

interface Props {
  version?: string;
  dbEngine: string;
  userEmail?: string | null;
  planName?: string | null;
  subscriptionStatus?: string | null;
  supportEmail?: string;
  repoUrl?: string;
}

const SystemInfoCard: React.FC<Props> = ({ version, dbEngine, userEmail, planName, subscriptionStatus, supportEmail = 'dev@seuprojeto.com', repoUrl }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informações do Sistema</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500 dark:text-gray-400">Versão:</span> <span className="text-gray-900 dark:text-white">{version || 'v1.0.0'}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Banco:</span> <span className="text-gray-900 dark:text-white">{dbEngine}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Usuário:</span> <span className="text-gray-900 dark:text-white">{userEmail || '—'}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Plano:</span> <span className="text-gray-900 dark:text-white">{planName || 'free'}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className="text-gray-900 dark:text-white">{subscriptionStatus || '—'}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Suporte:</span> <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">{supportEmail}</a></div>
        {repoUrl && (<div><span className="text-gray-500 dark:text-gray-400">Repositório:</span> <a href={repoUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{repoUrl}</a></div>)}
      </div>
    </div>
  );
};

export default SystemInfoCard;

