import React, { useState, useEffect } from 'react';
import { Save, Loader2, CloudCog, CreditCard, Star, Check, X, Brain, Calendar, Cloud, AlertTriangle, Building2, Phone, Globe, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { systemConfigService } from '../services/systemConfigService';
import { googleSheetsSyncService } from '../services/googleSheets.service'; // Import instance
import { OrganizationSetup } from '../model/types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../db/AppDatabase';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '../config/app.config';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import useSubscriptionFeatures from '../hooks/useSubscriptionFeatures';
import { stripeService } from '../services/payment/StripeService'; // Added stripeService

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
  
  const [config, setConfig] = useState<Partial<OrganizationSetup>>({});
  const [loading, setLoading] = useState(false); // This is for the organization form save
  const { showToast } = useToast();
  // const { subscription, isLoading: isLoadingSubscription, createSubscription } = useSubscription(); // Removed
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

  const loadConfig = async () => {
    const currentConfig = await systemConfigService.getConfig();
    if (currentConfig) {
      setConfig(currentConfig);
    }
  };

  const handleSave = async () => {
    setLoading(true);
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
      setLoading(false);
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
    } catch (error: any) { // Catch any unexpected errors from the service call itself
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
    try {
      await db.delete();
      await db.open();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const handleSubscribe = async (plan: 'free' | 'premium') => {
    // If user is already premium and tries to subscribe to premium again, or is free and tries to subscribe to free.
    if (plan === 'premium' && isPremium && subscriptionStatus === 'active') {
      showToast('Você já possui uma assinatura Premium ativa.', 'info');
      return;
    }
    if (plan === 'free' && !isPremium && subscriptionStatus === 'active') {
      showToast('Você já está no plano Gratuito.', 'info');
      // Here, you might want to implement a downgrade to free if they were premium and canceled,
      // but that typically involves backend logic to ensure the Stripe sub is truly ended etc.
      // For now, if they are 'active' and 'free', it's just an info message.
      return;
    }
    // If user has a non-active status (e.g. 'past_due', 'canceled') and clicks 'free', it's complex.
    // For now, let's assume 'free' button is mostly for downgrading or confirming current free status.
    // Clicking 'premium' should always try to create a premium subscription.

    if (!user?.email) {
      showToast('Por favor, faça login para gerenciar sua assinatura.', 'error');
      navigate('/login');
      return;
    }

    if (plan === 'premium') {
      try {
        setLoading(true); // Use a local loading state for the subscribe button action
        const stripeSession = await stripeService.createSubscription({
          planId: 'premium', // Or a more dynamic plan ID if you have multiple premium tiers
          interval: isAnnual ? 'year' : 'month',
          email: user.email,
          paymentMethod: 'card', // Fixed to 'card'
        });

        if (stripeSession?.url) {
          window.location.href = stripeSession.url;
        } else {
          showToast('Não foi possível iniciar o processo de assinatura. Tente novamente.', 'error');
        }
      } catch (error) {
        console.error('Error creating Stripe subscription session:', error);
        showToast('Erro ao iniciar assinatura. Tente novamente mais tarde.', 'error');
      } finally {
        setLoading(false);
      }
    } else if (plan === 'free') {
      // Logic for downgrading to Free would go here.
      // This typically involves backend calls to cancel any active Stripe subscription
      // and then update the local DB (e.g., via webhook or direct call).
      // For now, just a placeholder or info.
      showToast('A opção de downgrade para o plano gratuito precisa ser implementada no backend.', 'info');
    }
  };

  const renderOrganizationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Type - Read Only */}
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

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... (other fields) ... */}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Endereço
        </label>
        <input
          type="text"
          value={config.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Social Media */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Redes Sociais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ... (social media fields) ... */}
        </div>
      </div>

      {/* PIX Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuração do PIX</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ... (PIX fields) ... */}
        </div>
      </div>

      {/* System Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Moeda
          </label>
          <select
            value={config.currency || 'BRL'}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="require_auth" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Exigir autenticação
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`flex items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderSubscriptionContent = () => {
    // Use isAuthenticated as a proxy for initial loading of auth/subscription info
    if (!isAuthenticated && !user) { 
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    // Early bird: user has no subscription yet (status is 'inactive' or null from AuthContext for new users)
    // or they are on a 'free' plan and it's still active.
    const isPotentiallyEarlyBird = ((subscriptionStatus === 'active' && planName === 'free')) && earlyUsersCount < 50;


    return (
      <>
        {/* Early Access Banner */}
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

        {/* Current Subscription Status */}
        {subscriptionStatus === 'active' && (
          <div className={`mb-8 rounded-lg p-6 ${isCurrentlyPremium ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isCurrentlyPremium ? 'text-green-900 dark:text-green-400' : 'text-blue-900 dark:text-blue-400'}`}>
                  {isCurrentlyPremium ? 'Assinatura Premium Ativa' : 'Plano Gratuito Ativo'}
                </h3>
                {/* TODO: Add currentPeriodEnd from AuthContext if available */}
                {/* <p className={`mt-1 ${isCurrentlyPremium ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                  {isCurrentlyPremium ? `Próxima cobrança em: PlaceholderDate` : "Você está utilizando o plano gratuito."}
                </p> */}
              </div>
              <button
                onClick={() => navigate('/subscription-status')} // Navigate to the main subscription status page
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
       
        {(!isCurrentlyPremium) && (
          <>
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
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
        )

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Gratuito</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Recursos básicos para pequenos negócios
              </p>
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
              disabled={subscriptionStatus === 'active' && planName === 'free'} // Disable if already on active free plan
              className="w-full py-2 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscriptionStatus === 'active' && planName === 'free' ? 'Plano Atual' : 'Selecionar Gratuito'}
            </button>
          </div>

          {/* Premium Plan */}
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
                disabled={isCurrentlyPremium || loading} // Disable if already premium or if a subscription action is loading
              >
                {loading && planName === 'premium' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {isCurrentlyPremium ? 'Plano Premium Atual' : 'Assinar Premium'}
              </button>
            </div>
          </div>
        </div>
      </>
      )}
    </>
    );
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gerencie todas as configurações do sistema
        </p>
      </header>

      <nav className="flex space-x-4 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-1 border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="space-y-6">
        {activeTab === 'organization' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Configurações da Organização
            </h2>
            {renderOrganizationForm()}
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Planos e Assinatura
            </h2>
            {renderSubscriptionContent()}
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Integrações
            </h2>
            <div className="space-y-4">
              {isLoadingFeatures ? (
                <div className="flex justify-center items-center p-8 border dark:border-gray-700 rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="ml-3 text-gray-600 dark:text-gray-400">Verificando recursos...</p>
                </div>
              ) : (
                <div className={`border dark:border-gray-700 rounded-lg p-4 ${!canUseCloudBackup ? 'bg-gray-50 dark:bg-gray-700/30 opacity-75' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Google Sheets
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Sincronize seus dados com o Google Sheets.
                        {!canUseCloudBackup && !isLoadingFeatures && (
                          <span className="ml-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-700/50 px-2 py-0.5 rounded-full">
                            Recurso Premium
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="google_sync_enabled"
                          checked={config.google_sync_enabled || false}
                          onChange={(e) => handleChange('google_sync_enabled', e.target.checked)}
                          disabled={!canUseCloudBackup || isLoadingFeatures}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label 
                          htmlFor="google_sync_enabled" 
                          className={`ml-2 text-sm text-gray-700 dark:text-gray-300 ${(!canUseCloudBackup || isLoadingFeatures) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Ativar sincronização
                        </label>
                      </div>
                      <button
                        onClick={handleGoogleSheetsSync}
                        disabled={isSyncing || !config.google_sync_enabled || !canUseCloudBackup || isLoadingFeatures}
                        title={!canUseCloudBackup && !isLoadingFeatures ? "Funcionalidade disponível apenas no plano Premium." : "Sincronizar dados com Google Sheets"}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                                  ${(isSyncing || !config.google_sync_enabled || !canUseCloudBackup || isLoadingFeatures) 
                                    ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <CloudCog className="w-4 h-4 mr-2" />
                            Sincronizar Agora
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {syncMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${syncMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {syncMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Resetar Sistema</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Atenção: Esta ação irá apagar todos os dados do sistema e não pode ser desfeita.
            </p>
            <button
              onClick={() => setIsResetDialogOpen(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetSystem}
        title="Resetar Sistema"
        message="Tem certeza que deseja resetar o sistema? Todos os dados serão perdidos e esta ação não pode ser desfeita."
        confirmText="Resetar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}

export default Settings;
