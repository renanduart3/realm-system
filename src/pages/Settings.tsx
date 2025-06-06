import React, { useState, useEffect } from 'react';
import { Save, Loader2, CloudCog, CreditCard, Star, Check, X, Brain, Calendar, Cloud, AlertTriangle, Building2, Phone, Globe, Facebook, Instagram, Linkedin, Twitter, Pencil, RefreshCw } from 'lucide-react';
import { systemConfigService } from '../services/systemConfigService';
import { googleSheetsSyncService } from '../services/googleSheets.service';
import { OrganizationSetup } from '../model/types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../db/AppDatabase';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '../config/app.config';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import useSubscriptionFeatures from '../hooks/useSubscriptionFeatures';
import { stripeService } from '../services/payment/StripeService';
import { supabaseService } from '../services/supabaseService';

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
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [earlyUsersCount] = useState(27);
  const [isResetting, setIsResetting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [stripePlans, setStripePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const [config, setConfig] = useState<Partial<OrganizationSetup>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const { showToast } = useToast();
  const { 
    user, 
    isAuthenticated, 
    isPremium,
    planName,
    subscriptionStatus 
  } = useAuth() as { 
    user: any; 
    isAuthenticated: boolean; 
    isPremium: boolean; 
    planName: string; 
    subscriptionStatus: SubscriptionStatus;
  };
  const navigate = useNavigate();
  const { canUseCloudBackup, isLoading: isLoadingFeatures } = useSubscriptionFeatures();

  const premiumPlan = appConfig.subscription.plans.premium;
  const currentPrice = isAnnual ? premiumPlan.price.annual : premiumPlan.price.monthly;
  const discountedPrice = premiumPlan.earlyBirdDiscount?.enabled 
    ? currentPrice * (1 - premiumPlan.earlyBirdDiscount.discountPercentage / 100)
    : currentPrice;

  const isCurrentlyPremium = isPremium && subscriptionStatus === 'active';

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    loadPlansFromStripe();
  }, []);

  const loadConfig = async () => {
    const currentConfig = await systemConfigService.getConfig();
    if (currentConfig) {
      setConfig(currentConfig);
    }
  };

  const loadPlansFromStripe = async () => {
    setIsLoadingPlans(true);
    try {
      const { data: { session } } = await supabaseService.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não está autenticado');
      }

      const { data, error } = await supabaseService.functions.invoke('check-premium-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      // Transformar os dados recebidos para o formato esperado pelo componente
      const transformedData = [{
        id: 'premium',
        nickname: 'Premium',
        product: {
          name: 'Premium',
          description: 'Plano Premium com todos os recursos'
        },
        currency: 'BRL',
        unit_amount: data.type === 'monthly' ? 4990 : 47900, // R$ 49,90 ou R$ 479,00
        recurring: {
          interval: data.type === 'monthly' ? 'month' : 'year'
        },
        active: data.active
      }];

      console.log('Plans from Stripe:', transformedData);
      setStripePlans(transformedData);
    } catch (error) {
      console.error('Error fetching plans from Stripe:', error);
      showToast(`Erro ao carregar planos do Stripe: ${error}`, 'error');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchPlansFromStripe = async () => {
    try {
      const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/realm-stripe-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-plans'
        }),
      });
      const data = await response.json();
      console.log('Plans from Stripe:', data);
      return data;
    } catch (error) {
      console.error('Error fetching plans from Stripe:', error);
      return null;
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

  const handleGoogleSheetsSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    if (!canUseCloudBackup) {
      setSyncMessage({
        type: 'error',
        text: 'Esta é uma funcionalidade premium. Por favor, faça um upgrade para utilizar a sincronização com Google Sheets.',
      });
      setIsSyncing(false);
      return;
    }

    try {
      const result = await googleSheetsSyncService.exportDataToGoogleSheets(canUseCloudBackup);
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
      await db.delete();
      localStorage.clear();
      showToast('Sistema resetado com sucesso! Redirecionando para configuração...', 'success');
      setTimeout(() => {
        window.location.href = '/setup';
      }, 2000);
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

  const handleSubscribe = async (plan: 'free' | 'premium') => {
    if (!isAuthenticated || !user?.email) {
      showToast('Por favor, faça login para assinar o plano Premium.', 'error');
      navigate('/login');
      return;
    }

    if (plan === 'premium') {
      try {
        setIsCreatingSubscription(true);
        const stripeSession = await stripeService.createSubscription({
          planId: 'premium',
          interval: isAnnual ? 'year' : 'month',
          email: user.email,
          paymentMethod: 'card',
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
    } else {
      showToast('Você já está no plano gratuito.', 'info');
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome da Organização *
          </label>
          <input
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
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuração do PIX</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chave PIX
            </label>
            <input
              type="text"
              value={config.pix_key?.key || ''}
              onChange={(e) => handleChange('pix_key', { type: 'random', key: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="Digite sua chave PIX"
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome do Beneficiário
            </label>
            <input
              type="text"
              value={config.organization_name || ''}
              onChange={(e) => handleChange('organization_name', e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                !isEditMode ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="Nome do beneficiário PIX"
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          </div>
        </div>
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
    if (isLoadingFeatures) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    const isPotentiallyEarlyBird = ((subscriptionStatus === 'active' && planName === 'free')) && earlyUsersCount < 50;

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

        {subscriptionStatus === 'active' && (
          <div className={`mb-8 rounded-lg p-6 ${isCurrentlyPremium ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isCurrentlyPremium ? 'text-green-900 dark:text-green-400' : 'text-blue-900 dark:text-blue-400'}`}>
                  {isCurrentlyPremium ? 'Assinatura Premium Ativa' : 'Plano Gratuito Ativo'}
                </h3>
              </div>
              <button
                onClick={() => navigate('/subscription-status')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isCurrentlyPremium 
                    ? 'text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30' 
                    : 'text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}
              >
                Gerenciar Assinatura
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Plano Gratuito
              </h3>
              <div className="text-lg font-bold text-green-600">Sempre gratuito</div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold">R$ 0</div>
              <div className="text-gray-600 dark:text-gray-400">Sempre gratuito</div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span>Gestão básica de negócios</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <X className="w-5 h-5 text-red-600" />
                <span>Sem backup na nuvem</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <X className="w-5 h-5 text-red-600" />
                <span>Sem inteligência de negócios</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <X className="w-5 h-5 text-red-600" />
                <span>Sem recursos de agendamento</span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe('free')}
              disabled={subscriptionStatus === 'active' && planName === 'free'}
              className="w-full py-2 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscriptionStatus === 'active' && planName === 'free' ? 'Plano Atual' : 'Selecionar Gratuito'}
            </button>
          </div>

          <div className="bg-gradient-to-b from-blue-600 to-purple-600 rounded-xl shadow-lg p-[2px]">
            <div className="bg-white dark:bg-gray-900 rounded-[calc(0.75rem-2px)] p-8 h-full">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Premium</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Recursos completos para negócios em crescimento
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex items-center">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      !isAnnual 
                        ? 'bg-white dark:bg-gray-600 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isAnnual 
                        ? 'bg-white dark:bg-gray-600 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Anual
                    <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                      Economize 20%
                    </span>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">
                    R$ {discountedPrice.toFixed(2)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    /{isAnnual ? 'ano' : 'mês'}
                  </div>
                </div>
                {isPotentiallyEarlyBird && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Preço early access - Garanta esta taxa!</span>
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {premiumPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe('premium')}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                disabled={isCurrentlyPremium || isCreatingSubscription}
              >
                {isCreatingSubscription ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {isCurrentlyPremium ? 'Plano Premium Atual' : 'Assinar Premium'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Informações de Debug:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>isAuthenticated: {String(isAuthenticated)}</div>
            <div>isPremium: {String(isPremium)}</div>
            <div>subscriptionStatus: {subscriptionStatus || 'null'}</div>
            <div>planName: {planName || 'null'}</div>
            <div>isCurrentlyPremium: {String(isCurrentlyPremium)}</div>
            <div>user: {user ? 'exists' : 'null'}</div>
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
                    disabled={isSyncing || !canUseCloudBackup}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      canUseCloudBackup
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