import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { systemConfigService } from '../services/systemConfigService';
import { googleSheetsSyncService } from '../services/googleSheets.service';
import { OrganizationSetup } from '../model/types';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { appConfig } from '../config/app.config';
import { useToast } from '../hooks/useToast';
import useSubscriptionFeatures from '../hooks/useSubscriptionFeatures';
import SubscriptionPlansSection from '../components/subscription/SubscriptionPlans';
import OrganizationSettingsForm from '../components/settings/OrganizationSettingsForm';
import IntegrationsSection from '../components/settings/IntegrationsSection';
import ResetSection from '../components/settings/ResetSection';
import SystemInfoCard from '../components/settings/SystemInfoCard';
import { exportDatabase, downloadJsonDump, importDatabase } from '../utils/dbBackup';
import { backupSqliteToLocal, restoreSqliteFromLocal, backupSqliteToGoogleDrive } from '../services/backupService';

type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'free' | 'none' | null;

interface TabItem {
  id: string;
  label: string;
}

const tabs: TabItem[] = [
  { id: 'organization', label: 'Organização' },
  { id: 'subscription', label: 'Planos e Assinatura' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'reset', label: 'Resetar Sistema' }
];

const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('organization');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [config, setConfig] = useState<Partial<OrganizationSetup>>({});

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isOAuthSyncing, setIsOAuthSyncing] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDriveBackup, setIsDriveBackup] = useState(false);

  const { isPremium: isPremiumFromHook } = useSubscriptionFeatures();
  const { user, isAuthenticated, planName, subscriptionStatus } = useAuth() as {
    user: any;
    isAuthenticated: boolean;
    planName: string | null;
    subscriptionStatus: SubscriptionStatus;
  };

  useEffect(() => {
    loadConfig();

    const tabParam = searchParams.get('tab');
    if (tabParam && ['organization', 'subscription', 'integrations', 'reset'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadConfig = async () => {
    const currentConfig = await systemConfigService.getConfig();
    if (currentConfig) {
      // Migrar chave pix antiga (pix_key) para pix_keys
      // @ts-ignore
      if (currentConfig.pix_key && !currentConfig.pix_keys) {
        // @ts-ignore
        const migratedPixKey = {
          id: uuidv4(),
          // @ts-ignore
          type: currentConfig.pix_key.type,
          // @ts-ignore
          key: currentConfig.pix_key.key,
          description: 'Chave PIX Principal',
          bank_name: '',
          beneficiary_name: currentConfig.organization_name || ''
        };

        currentConfig.pix_keys = [migratedPixKey];
        // @ts-ignore
        delete currentConfig.pix_key;
        await systemConfigService.saveConfig(currentConfig);
      }
      setConfig(currentConfig);
    }
  };

  const handleSave = async () => {
    setIsSavingConfig(true);
    try {
      const success = await systemConfigService.saveConfig(config);
      if (success) {
        showToast('Configurações salvas com sucesso!', 'success');
      } else {
        showToast('Erro ao salvar configurações', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleChange = (field: keyof OrganizationSetup, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleSheetsSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    if (!isPremiumFromHook) {
      setSyncMessage({ type: 'error', text: 'Funcionalidade premium. Faça upgrade para sincronizar com Google Sheets.' });
      setIsSyncing(false);
      return;
    }
    try {
      const result = await googleSheetsSyncService.exportDataToGoogleSheets(isPremiumFromHook as any);
      setSyncMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch (error: any) {
      console.error('Google Sheets Sync Error:', error);
      setSyncMessage({ type: 'error', text: error?.message || 'Erro inesperado.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSheetsOAuthSync = async () => {
    setIsOAuthSyncing(true);
    setSyncMessage(null);
    if (!isPremiumFromHook) {
      setSyncMessage({ type: 'error', text: 'Funcionalidade premium. Faça upgrade para sincronizar com Google Sheets.' });
      setIsOAuthSyncing(false);
      return;
    }
    try {
      const result = await (googleSheetsSyncService as any).exportDataToGoogleSheetsWithOAuth?.(isPremiumFromHook);
      setSyncMessage({ type: result?.success ? 'success' : 'error', text: result?.message || 'Falha na sincronização.' });
    } catch (error: any) {
      console.error('Google Sheets OAuth Sync Error:', error);
      setSyncMessage({ type: 'error', text: error?.message || 'Erro inesperado.' });
    } finally {
      setIsOAuthSyncing(false);
    }
  };

  const handleResetSystem = async () => {
    setIsResetDialogOpen(false);
    setIsResetting(true);
    try {
      const { resetDatabase, forceDatabaseReopen } = await import('../utils/resetDatabase');
      await resetDatabase();
      await forceDatabaseReopen();
      await systemConfigService.initialize();

      // Preservar sessão do Supabase
      const preserveEntries: { key: string; value: string }[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) {
            const value = localStorage.getItem(key);
            if (value != null) preserveEntries.push({ key, value });
          }
        }
      } catch {}

      localStorage.clear();
      sessionStorage.clear();
      try { preserveEntries.forEach(({ key, value }) => localStorage.setItem(key, value)); } catch {}

      showToast('Sistema resetado com sucesso! Redirecionando...', 'success');
      navigate('/setup', { replace: true });
      window.location.reload();
    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      showToast('Erro ao resetar sistema', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportBackup = async () => {
    if (!isPremiumFromHook) {
      showToast('Recurso disponível apenas no plano Premium.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      if (appConfig.dbEngine === 'sqlite') {
        const path = await backupSqliteToLocal();
        showToast(path ? `Backup salvo em: ${path}` : 'Backup cancelado.', path ? 'success' : 'info');
      } else {
        const dump = await exportDatabase();
        downloadJsonDump(dump);
        showToast('Backup (JSON) exportado com sucesso.', 'success');
      }
    } catch (e: any) {
      console.error('Erro ao exportar backup:', e);
      showToast(e?.message || 'Erro ao exportar backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (file?: File) => {
    if (!isPremiumFromHook) {
      showToast('Recurso disponível apenas no plano Premium.', 'error');
      return;
    }
    try {
      if (!file) return;
      setIsImporting(true);
      if (appConfig.dbEngine === 'sqlite') {
        const ok = await restoreSqliteFromLocal();
        showToast(ok ? 'Backup restaurado com sucesso. Recarregando...' : 'Restauração cancelada.', ok ? 'success' : 'info');
      } else {
        const text = await file.text();
        const dump = JSON.parse(text);
        await importDatabase(dump);
        showToast('Backup (JSON) importado com sucesso. Recarregando...', 'success');
      }
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      console.error('Erro ao importar backup:', e);
      showToast(e?.message || 'Erro ao importar backup.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDriveBackup = async () => {
    if (!isPremiumFromHook) {
      showToast('Recurso disponível apenas no plano Premium.', 'error');
      return;
    }
    if (appConfig.dbEngine !== 'sqlite') {
      showToast('Backup no Drive disponível apenas com banco SQLite (Electron).', 'info');
      return;
    }
    try {
      setIsDriveBackup(true);
      const id = await backupSqliteToGoogleDrive();
      showToast(id ? `Backup enviado ao Google Drive (id: ${id})` : 'Não foi possível enviar ao Drive.', id ? 'success' : 'error');
    } catch (e: any) {
      console.error('Drive backup error:', e);
      showToast(e?.message || 'Erro ao enviar backup ao Drive.', 'error');
    } finally {
      setIsDriveBackup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const handleEditToggle = () => setIsEditMode(!isEditMode);
  const handleCancelEdit = () => { setIsEditMode(false); loadConfig(); };

  // PIX handlers
  const handleAddPixKey = () => {
    setConfig(prev => {
      const list = prev.pix_keys || [];
      if (list.length >= 4) return prev;
      return {
        ...prev,
        pix_keys: [...list, { id: uuidv4(), type: 'random', key: '', description: '', bank_name: '', beneficiary_name: '' }]
      };
    });
  };

  const handleUpdatePixKey = (id: string, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      pix_keys: (prev.pix_keys || []).map(k => k.id === id ? { ...k, [field]: value } : k)
    }));
  };

  const handleRemovePixKey = (id: string) => {
    setConfig(prev => ({
      ...prev,
      pix_keys: (prev.pix_keys || []).filter(k => k.id !== id)
    }));
  };

  // Organization form moved to component

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="w-full md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg ${activeTab === tab.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'organization' && (
            <OrganizationSettingsForm
              config={config}
              onChange={handleChange}
              isEditMode={isEditMode}
              onToggleEdit={handleEditToggle}
              onCancelEdit={handleCancelEdit}
              onSubmit={handleSubmit}
              isSaving={isSavingConfig}
              onAddPixKey={handleAddPixKey}
              onUpdatePixKey={handleUpdatePixKey}
              onRemovePixKey={handleRemovePixKey}
            />
          )}
          {activeTab === 'organization' && (
            <SystemInfoCard
              version={import.meta.env.VITE_APP_VERSION}
              dbEngine={appConfig.dbEngine}
              userEmail={user?.email || null}
              planName={planName}
              subscriptionStatus={subscriptionStatus}
              supportEmail={'dev@seuprojeto.com'}
              repoUrl={'https://github.com/seu-repo/realm-system'}
            />
          )}
          {activeTab === 'subscription' && <SubscriptionPlansSection />}
          {activeTab === 'integrations' && (
            <IntegrationsSection
              isPremium={isPremiumFromHook}
              isSyncing={isSyncing}
              isOAuthSyncing={isOAuthSyncing}
              onSync={handleGoogleSheetsSync}
              onOAuthSync={handleGoogleSheetsOAuthSync}
              message={syncMessage}
              showBackup
              onExport={handleExportBackup}
              onImport={handleImportBackup}
              onDriveBackup={handleDriveBackup}
              isExporting={isExporting}
              isImporting={isImporting}
              isDriveBackup={isDriveBackup}
              canDriveBackup={appConfig.dbEngine === 'sqlite'}
            />
          )}
          {activeTab === 'reset' && (
            <>
              <ResetSection
                onReset={() => setIsResetDialogOpen(true)}
                isResetting={isResetting}
                onExport={handleExportBackup}
                onImport={handleImportBackup}
                onDriveBackup={handleDriveBackup}
                isExporting={isExporting}
                isImporting={isImporting}
                isDriveBackup={isDriveBackup}
                canUsePremium={isPremiumFromHook}
                canDriveBackup={isPremiumFromHook && appConfig.dbEngine === 'sqlite'}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={isResetDialogOpen} onClose={() => setIsResetDialogOpen(false)} onConfirm={handleResetSystem} title="Confirmar Reset do Sistema" message="Tem certeza que deseja resetar o sistema? Esta ação não pode ser desfeita e todos os dados serão perdidos." confirmText="Sim, Resetar" cancelText="Cancelar" />
    </div>
  );
};

export default Settings;
