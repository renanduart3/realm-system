import React, { useState, useEffect } from 'react';
import { Save, Loader2, CloudCog, CreditCard, Star, Check, X, Cloud, AlertTriangle, Facebook, Instagram, Linkedin, Twitter, Pencil, Plus, Trash2 } from 'lucide-react';
import { systemConfigService } from '../services/systemConfigService';
import { googleSheetsSyncService } from '../services/googleSheets.service';
import { OrganizationSetup } from '../model/types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../db/AppDatabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appConfig } from '../config/app.config';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import useSubscriptionFeatures from '../hooks/useSubscriptionFeatures';
import { stripeService } from '../services/payment/StripeService';
import { supabaseService } from '../services/supabaseService';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../utils/formatters';

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

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('organization');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [earlyUsersCount] = useState(27);
  const [isResetting, setIsResetting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [stripePlans, setStripePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true); // CORREÇÃO: Iniciar como true

  const [config, setConfig] = useState<Partial<OrganizationSetup>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const { showToast } = useToast();
  const {
    user,
    isAuthenticated,
    planName,
    subscriptionStatus
  } = useAuth() as {
    user: any;
    isAuthenticated: boolean;
    planName: string;
    subscriptionStatus: SubscriptionStatus;
  };
  const navigate = useNavigate();
  const { 
    isPremium: isPremiumFromHook
  } = useSubscriptionFeatures();

  const isCurrentlyPremium = isPremiumFromHook && subscriptionStatus === 'active';
  
  // Verificar se está em modo de desenvolvimento (variável de ambiente ativa)
  const isDevMode = import.meta.env.VITE_APP_SUBSCRIPTION_PREMIUM === 'true';

  useEffect(() => {
    loadConfig();
    loadPlansFromStripe();
    
    // Verificar se há parâmetro tab na URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['organization', 'subscription', 'integrations', 'reset'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);


  const loadConfig = async () => {
    const currentConfig = await systemConfigService.getConfig();
    if (currentConfig) {
      // CORREÇÃO: Lógica de migração da chave PIX antiga (pix_key) para o novo formato (pix_keys)
      // @ts-ignore - Acessando uma propriedade potencialmente inexistente para migração
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

  const loadPlansFromStripe = async () => {
    setIsLoadingPlans(true);
    try {
      const { data, error } = await supabaseService.functions.invoke('get-stripe-plans');

      if (error) {
        throw error;
      }
      console.log('Plans from Stripe:', data);
      setStripePlans(data || []); 

    } catch (error) {
      console.error('Error fetching plans from Stripe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      showToast(`Erro ao carregar os planos: ${errorMessage}`, 'error');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSave = async () => {
    setIsSavingConfig(true);
    try {
      const success = await systemConfigService.saveConfig(config);
      if (success) {
        showToast('Configurações salvas com sucesso!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPixKey = () => {
    const newPixKey = {
      id: uuidv4(),
      type: 'random' as const,
      key: '',
      description: '',
      bank_name: '',
      beneficiary_name: ''
    };

    setConfig(prev => ({
      ...prev,
      pix_keys: [...(prev.pix_keys || []), newPixKey]
    }));
  };

  const updatePixKey = (id: string, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      pix_keys: prev.pix_keys?.map(pixKey =>
        pixKey.id === id ? { ...pixKey, [field]: value } : pixKey
      ) || []
    }));
  };

  const removePixKey = (id: string) => {
    setConfig(prev => ({
      ...prev,
      pix_keys: prev.pix_keys?.filter(pixKey => pixKey.id !== id) || []
    }));
  };

  const handleGoogleSheetsSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    if (!isPremiumFromHook) {
      setSyncMessage({
        type: 'error',
        text: 'Esta é uma funcionalidade premium. Por favor, faça um upgrade para utilizar a sincronização com Google Sheets.',
      });
      setIsSyncing(false);
      return;
    }

    try {
      const result = await googleSheetsSyncService.exportDataToGoogleSheets(isPremiumFromHook);
      if (result.success) {
        setSyncMessage({ type: 'success', text: result.message });
      } else {
        setSyncMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      console.error('Google Sheets Sync Error:', error);
      setSyncMessage({
        type: 'error',
        text: error.message || 'Erro inesperado durante a sincronização com Google Sheets.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetSystem = async () => {
    setIsResetDialogOpen(false);
    setIsResetting(true);

    try {
      db.close();
      await db.delete();
      await systemConfigService.initialize(); 

      localStorage.clear();
      sessionStorage.clear();

      showToast('Sistema resetado com sucesso! Redirecionando para a configuração...', 'success');

      navigate('/setup', { replace: true });
      window.location.reload(); 

    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      showToast('Erro ao resetar sistema', 'error');
    } finally {
      setIsResetting(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    loadConfig();
  };

  const handleSubscribe = async (priceId: string) => {
    if (!isAuthenticated || !user?.email) {
      showToast('Por favor, faça login para assinar.', 'error');
      navigate('/login');
      return;
    }

    try {
      setIsCreatingSubscription(true);
      const stripeSession = await stripeService.createSubscription({
        priceId: priceId,
        email: user.email,
      });

      if (stripeSession?.url) {
        window.location.href = stripeSession.url;
      } else {
        showToast('Não foi possível iniciar o processo de assinatura. Tente novamente.', 'error');
      }
    } catch (error: any) {
      console.error('Error creating Stripe subscription session:', error);
      showToast(error.message || 'Erro ao iniciar assinatura. Tente novamente mais tarde.', 'error');
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleChangePlan = async (_priceId: string) => {
    if (!isAuthenticated || !user?.email) {
      showToast('Por favor, faça login para alterar o plano.', 'error');
      navigate('/login');
      return;
    }

    try {
      setIsCreatingSubscription(true);
      // Aqui você implementaria a lógica para alterar o plano existente
      showToast('Funcionalidade de mudança de plano em desenvolvimento', 'info');
    } catch (error: any) {
      console.error('Error changing subscription plan:', error);
      showToast(error.message || 'Erro ao alterar plano. Tente novamente mais tarde.', 'error');
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!isAuthenticated) {
      showToast('Por favor, faça login para cancelar a assinatura.', 'error');
      navigate('/login');
      return;
    }

    try {
      // Aqui você implementaria a lógica para cancelar a assinatura
      showToast('Funcionalidade de cancelamento em desenvolvimento', 'info');
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      showToast(error.message || 'Erro ao cancelar assinatura. Tente novamente mais tarde.', 'error');
    }
  };

  const renderOrganizationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configurações da Organização
          </h2>
          {!isEditMode && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (Somente leitura)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button
              type="button"
              onClick={handleEditToggle}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingConfig}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  isSavingConfig ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de Organização
        </label>
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-white font-medium">
            {config.organization_type === 'profit' ? 'Com fins lucrativos' : 'Sem fins lucrativos'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Para alterar, use a opção "Resetar Sistema"
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome da Organização *
          </label>
          <input
            id="organization_name"
            type="text"
            value={config.organization_name || ''}
            onChange={(e) => handleChange('organization_name', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
              !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
            }`}
            required
            readOnly={!isEditMode}
            disabled={!isEditMode}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={config.commercial_phone || ''}
            onChange={(e) => handleChange('commercial_phone', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
              !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
            }`}
            readOnly={!isEditMode}
            disabled={!isEditMode}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Telefone
          </label>
          <input
            type="tel"
            value={config.commercial_phone || ''}
            onChange={(e) => handleChange('commercial_phone', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
              !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
            }`}
            readOnly={!isEditMode}
            disabled={!isEditMode}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Website
          </label>
          <input
            type="url"
            value={config.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
              !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
            }`}
            readOnly={!isEditMode}
            disabled={!isEditMode}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Endereço
        </label>
        <input
          type="text"
          value={config.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
            !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
          }`}
          readOnly={!isEditMode}
          disabled={!isEditMode}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Redes Sociais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Facebook className="w-4 h-4 inline mr-2" />
              Facebook
            </label>
            <input
              type="url"
              value={config.social_media?.facebook || ''}
              onChange={(e) => handleChange('social_media', { ...config.social_media, facebook: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="https://facebook.com/sua-empresa"
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Instagram className="w-4 h-4 inline mr-2" />
              Instagram
            </label>
            <input
              type="url"
              value={config.social_media?.instagram || ''}
              onChange={(e) => handleChange('social_media', { ...config.social_media, instagram: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="https://instagram.com/sua-empresa"
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Linkedin className="w-4 h-4 inline mr-2" />
              LinkedIn
            </label>
            <input
              type="url"
              value={config.social_media?.linkedin || ''}
              onChange={(e) => handleChange('social_media', { ...config.social_media, linkedin: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="https://linkedin.com/company/sua-empresa"
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Twitter className="w-4 h-4 inline mr-2" />
              Twitter
            </label>
            <input
              type="url"
              value={config.social_media?.twitter || ''}
              onChange={(e) => handleChange('social_media', { ...config.social_media, twitter: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="https://twitter.com/sua-empresa"
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chaves PIX</h3>
          {isEditMode && (
            <button
              type="button"
              onClick={addPixKey}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Chave
            </button>
          )}
        </div>
        
        {config.pix_keys && config.pix_keys.length > 0 ? (
          <div className="space-y-4">
            {config.pix_keys.map((pixKey) => (
              <div key={pixKey.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chave PIX #{config.pix_keys?.indexOf(pixKey)! + 1}
                  </span>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => removePixKey(pixKey.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Tipo da Chave
                    </label>
                    <select
                      value={pixKey.type}
                      onChange={(e) => updatePixKey(pixKey.id, 'type', e.target.value)}
                      className={`w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      disabled={!isEditMode}
                    >
                      <option value="random">Chave Aleatória</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={pixKey.key}
                      onChange={(e) => updatePixKey(pixKey.id, 'key', e.target.value)}
                      className={`w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="Digite a chave PIX"
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={pixKey.description}
                      onChange={(e) => updatePixKey(pixKey.id, 'description', e.target.value)}
                      className={`w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="Ex: Conta Principal, Conta Secundária"
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Nome do Banco
                    </label>
                    <input
                      type="text"
                      value={pixKey.bank_name || ''}
                      onChange={(e) => updatePixKey(pixKey.id, 'bank_name', e.target.value)}
                      className={`w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="Ex: Banco do Brasil"
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Nome do Beneficiário
                    </label>
                    <input
                      type="text"
                      value={pixKey.beneficiary_name || ''}
                      onChange={(e) => updatePixKey(pixKey.id, 'beneficiary_name', e.target.value)}
                      className={`w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                        !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="Nome do beneficiário"
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nenhuma chave PIX cadastrada.</p>
            {isEditMode && (
              <p className="text-sm mt-1">Clique em "Adicionar Chave" para começar.</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Moeda
          </label>
          <select
            value={config.currency || 'BRL'}
            onChange={(e) => handleChange('currency', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
              !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
            }`}
            disabled={!isEditMode}
          >
            <option value="BRL">BRL (R$)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require_auth"
            checked={config.require_auth || false}
            onChange={(e) => handleChange('require_auth', e.target.checked)}
            className={`form-checkbox ${!isEditMode ? 'cursor-not-allowed opacity-50' : ''}`}
            disabled={!isEditMode}
          />
          <label htmlFor="require_auth" className={`ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 ${
            !isEditMode ? 'cursor-not-allowed opacity-50' : ''
          }`}>
            Exigir autenticação
          </label>
        </div>
      </div>
    </form>
  );

  const renderSubscriptionContent = () => {
    // CORREÇÃO: Usa apenas isLoadingPlans para mostrar o spinner de planos
    if (isLoadingPlans) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="ml-4 text-gray-600 dark:text-gray-400">Carregando informações dos planos...</p>
        </div>
      );
    }
  
    const isPotentiallyEarlyBird = (subscriptionStatus === 'active' && planName === 'free') && earlyUsersCount < 50;
  
    const monthlyPlan = stripePlans.find(p => p.interval === 'month');
    const annualPlan = stripePlans.find(p => p.interval === 'year');
  
    return (
      <>
        {isPotentiallyEarlyBird && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-semibold">Oferta Early Access!</h2>
                  <p className="text-white/90">
                    Seja um dos nossos primeiros {appConfig.subscription.plans.premium.earlyBirdDiscount?.maxUsers || 50} usuários e ganhe um desconto vitalício.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <span className="font-semibold text-2xl">{50 - earlyUsersCount}</span>
                <span className="text-sm">vagas restantes</span>
              </div>
            </div>
          </div>
        )}
  
        {(subscriptionStatus === 'active' || isDevMode) && (
          <div className={`mb-8 rounded-lg p-6 ${(isCurrentlyPremium || isDevMode) ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${(isCurrentlyPremium || isDevMode) ? 'text-green-900 dark:text-green-400' : 'text-blue-900 dark:text-blue-400'}`}>
                  {(isCurrentlyPremium || isDevMode) ? 'Assinatura Premium Ativa' : 'Plano Gratuito Ativo'}
                </h3>
                {isDevMode && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Modo Desenvolvimento - Premium ativo via variável de ambiente
                  </p>
                )}
              </div>
              <div className="flex gap-2">

                {(isCurrentlyPremium || isDevMode) && (
                  <button
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Cancelar Assinatura
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Plano Gratuito (estático) */}
          <div className="border dark:border-gray-700 rounded-lg p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plano Gratuito</h3>
            <p className="text-2xl font-bold mt-2">R$ 0</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Sempre gratuito</p>
            <ul className="space-y-2 mb-8 text-sm flex-grow">
              <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/>Gestão completa de negócios</li>
              <li className="flex items-center text-gray-400"><X className="w-4 h-4 mr-2 text-red-500"/>Sem backup na nuvem</li>
              <li className="flex items-center text-gray-400"><X className="w-4 h-4 mr-2 text-red-500"/>Sem inteligência de negócios</li>
              <li className="flex items-center text-gray-400"><X className="w-4 h-4 mr-2 text-red-500"/>Sem sincronização Google Sheets</li>
              <li className="flex items-center text-gray-400"><X className="w-4 h-4 mr-2 text-red-500"/>Sem exportação de dados</li>
            </ul>
            <button
              disabled={subscriptionStatus === 'active' && planName === 'free'}
              className="w-full py-2 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscriptionStatus === 'active' && planName === 'free' ? 'Plano Atual' : 'Selecionar Gratuito'}
            </button>
          </div>
  
          {/* Planos Premium (dinâmicos) */}
          <div className="grid grid-cols-1 gap-6">
            {monthlyPlan && (
              <div className="border dark:border-gray-700 rounded-lg p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{monthlyPlan.name} Mensal</h3>
                <p className="text-2xl font-bold mt-2">{formatCurrency(monthlyPlan.price)}<span className="text-sm font-normal text-gray-500">/mês</span></p>
                <ul className="space-y-2 my-6 text-sm flex-grow">
                  {appConfig.subscription.plans.premium.features.map(f => <li key={f} className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/>{f}</li>)}
                </ul>
                <button
                  onClick={() => (isCurrentlyPremium || isDevMode) ? handleChangePlan(monthlyPlan.priceId) : handleSubscribe(monthlyPlan.priceId)}
                  disabled={isCreatingSubscription}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                  {isCreatingSubscription ? <Loader2 className="w-5 h-5 animate-spin"/> : <CreditCard className="w-5 h-5" />}
                  {(isCurrentlyPremium || isDevMode) ? 'Mudar para Mensal' : 'Assinar Mensal'}
                </button>
              </div>
            )}
            {annualPlan && (
              <div className="border-2 border-purple-500 rounded-lg p-6 flex flex-col relative">
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">MAIS POPULAR</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{annualPlan.name} Anual</h3>
                <p className="text-2xl font-bold mt-2">{formatCurrency(annualPlan.price)}<span className="text-sm font-normal text-gray-500">/ano</span></p>
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800 dark:text-green-300 font-medium">💰 Economia de R$ 49,88</span>
                    <span className="text-xs text-green-600 dark:text-green-400">20% OFF</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    vs R$ 239,88 se pagar mensalmente
                  </p>
                </div>
                <ul className="space-y-2 my-6 text-sm flex-grow">
                  {appConfig.subscription.plans.premium.features.map(f => <li key={f} className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/>{f}</li>)}
                </ul>
                <button
                  onClick={() => (isCurrentlyPremium || isDevMode) ? handleChangePlan(annualPlan.priceId) : handleSubscribe(annualPlan.priceId)}
                  disabled={isCreatingSubscription}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-purple-400"
                >
                  {isCreatingSubscription ? <Loader2 className="w-5 h-5 animate-spin"/> : <CreditCard className="w-5 h-5" />}
                  {(isCurrentlyPremium || isDevMode) ? 'Mudar para Anual' : 'Assinar Anual'}
                </button>
              </div>
            )}
          </div>
          
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="w-full md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'organization' && renderOrganizationForm()}
          {activeTab === 'subscription' && renderSubscriptionContent()}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Integrações
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CloudCog className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Google Sheets
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sincronize seus dados com o Google Sheets
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleSheetsSync}
                    disabled={isSyncing || !isPremiumFromHook}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      isPremiumFromHook
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" />
                        Sincronizar
                      </>
                    )}
                  </button>
                </div>

                {!isPremiumFromHook && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Funcionalidade Premium
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                          A sincronização com Google Sheets está disponível apenas no plano Premium. 
                          <button 
                            onClick={() => setActiveTab('subscription')}
                            className="underline hover:no-underline ml-1"
                          >
                            Atualize seu plano
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {syncMessage && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      syncMessage.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {syncMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'reset' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resetar Sistema
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Aviso Importante
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Esta ação irá resetar todo o sistema para as configurações iniciais.
                      Todos os dados serão perdidos.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsResetDialogOpen(true)}
                  disabled={isResetting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Resetar Sistema
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetSystem}
        title="Confirmar Reset do Sistema"
        message="Tem certeza que deseja resetar o sistema? Esta ação não pode ser desfeita e todos os dados serão perdidos."
        confirmText="Sim, Resetar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Settings;