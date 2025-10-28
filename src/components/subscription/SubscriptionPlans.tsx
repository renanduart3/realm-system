import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, CreditCard, Star, Check, X } from 'lucide-react';
import { appConfig } from '../../config/app.config';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { stripeService } from '../../services/payment/StripeService';
import { formatCurrency } from '../../utils/formatters';
import { safeInvokeFunction } from '../../utils/safeInvoke';
import { planCacheService } from '../../services/planCacheService';

type Interval = 'month' | 'year' | null;

const SubscriptionPlansSection: React.FC = () => {
  const { showToast } = useToast();
  const {
    user,
    isAuthenticated,
    planName,
    subscriptionStatus,
    isLifetime,
    refreshSubscription
  } = useAuth() as any;

  const [stripePlans, setStripePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [currentInterval, setCurrentInterval] = useState<Interval>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');

  const isDevMode = import.meta.env.VITE_APP_SUBSCRIPTION_PREMIUM === 'true';
  const isCurrentlyPremium = useMemo(() => isDevMode || (subscriptionStatus === 'active' && planName === 'premium'), [isDevMode, subscriptionStatus, planName]);

  // Helper to avoid hanging requests: reject if a request takes too long
  const withTimeout = async <T,>(promise: Promise<T>, ms = 30000): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Tempo esgotado ao iniciar o checkout. Tente novamente.'));
      }, ms);
      promise
        .then((val) => { clearTimeout(timer); resolve(val); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  };

  useEffect(() => {
    let mounted = true;
    const loadPlansFromStripe = async () => {
      setIsLoadingPlans(true);
      try {
        const cached = await planCacheService.ensurePlans({ ttlMs: 7 * 24 * 60 * 60 * 1000 });
        if (!mounted) return;
        // Normalize to array form for rendering ease
        const arr: any[] = [];
        if (cached.monthly) arr.push({ name: cached.monthly.name, priceId: cached.monthly.priceId, price: cached.monthly.price, interval: 'month' });
        if (cached.annual) arr.push({ name: cached.annual.name, priceId: cached.annual.priceId, price: cached.annual.price, interval: 'year' });
        setStripePlans(arr);
        setUseFallback(cached.source !== 'supabase');
      } catch (error: any) {
        if (!mounted) return;
        console.error('Error loading cached plans:', error);
        setUseFallback(true);
      } finally {
        if (!mounted) return;
        setIsLoadingPlans(false);
      }
    };
    loadPlansFromStripe();

    (async () => {
      if (!isCurrentlyPremium) { setCurrentInterval(null); return; }
      try {
        const data = await safeInvokeFunction(
          supabaseService.functions,
          'check-premium-subscription',
          undefined,
          { cacheKey: 'check-premium-subscription', ttlMs: 5 * 24 * 60 * 60_000, maxRetries: 1, retryDelayBaseMs: 400 }
        );
        if (mounted && (data?.interval === 'month' || data?.interval === 'year')) {
          setCurrentInterval(data.interval);
        } else if (mounted) {
          setCurrentInterval(null);
        }
      } catch {
        if (mounted) setCurrentInterval(null);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!isAuthenticated || !user?.email) {
      try { localStorage.setItem('pendingPriceId', priceId); } catch {}
      showToast('Você precisa fazer login para assinar.', 'info');
      window.location.href = '/login';
      return;
    }
    try {
      setIsCreatingSubscription(true);
      // Protect against functions that hang or slow network by enforcing a timeout
      const stripeSession = await withTimeout(
        stripeService.createSubscription({ priceId, email: user.email }),
        30000
      );
      if (stripeSession?.url) {
        window.location.href = stripeSession.url;
      } else {
        showToast('Não foi possível iniciar o processo de assinatura. Tente novamente.', 'error');
      }
    } catch (error: any) {
      console.error('Error creating Stripe subscription session:', error);
      const msg = String(error?.message || 'Erro ao iniciar assinatura. Tente novamente mais tarde.');
      // Mensagem amigável para possível cold start da função
      if (/Tempo esgotado|timeout/i.test(msg)) {
        showToast('Servidor iniciando. Tente novamente em alguns segundos.', 'warning');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleChangePlan = async (_priceId: string) => {
    showToast('Funcionalidade de mudança de plano em desenvolvimento', 'info');
  };

  const handleCancelSubscription = async () => {
    showToast('Funcionalidade de cancelamento em desenvolvimento', 'info');
  };

  const handleRedeemLifetime = async () => {
    if (!isAuthenticated || !user?.email) {
      showToast('Faça login para resgatar o código.', 'error');
      window.location.href = '/login';
      return;
    }
    if (!redeemCode.trim()) {
      showToast('Informe um código válido.', 'error');
      return;
    }
    try {
      setIsRedeeming(true);
      const { data: { session } } = await supabaseService.auth.getSession();
      if (!session) {
        showToast('Sessão inválida. Faça login novamente.', 'error');
        return;
      }
      const { data, error } = await supabaseService.functions.invoke('redeem-code', {
        body: { code: redeemCode.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (error) {
        showToast(error.message || 'Não foi possível resgatar o código.', 'error');
        return;
      }
      if (data?.success) {
        showToast('Licença vitalícia ativada! 🎉', 'success');
        setRedeemCode('');
        await refreshSubscription?.();
      } else {
        showToast('Falha ao resgatar o código.', 'error');
      }
    } catch (e: any) {
      console.error('Redeem error:', e);
      showToast(e?.message || 'Erro ao resgatar o código.', 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoadingPlans) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-4 text-gray-600 dark:text-gray-400">Carregando informações dos planos...</p>
      </div>
    );
  }

  const fallbackMonthlyId = (appConfig.subscription.plans.premium as any)?.price?.monthlyPriceId;
  const fallbackAnnualId = (appConfig.subscription.plans.premium as any)?.price?.annualPriceId;
  const fallbackMonthlyPrice = (appConfig.subscription.plans.premium as any)?.price?.monthly;
  const fallbackAnnualPrice = (appConfig.subscription.plans.premium as any)?.price?.annual;

  const monthlyPlan = useFallback
    ? (fallbackMonthlyId ? { name: 'Premium', price: fallbackMonthlyPrice, priceId: fallbackMonthlyId } : null)
    : stripePlans.find(p => p.interval === 'month');
  const annualPlan = useFallback
    ? (fallbackAnnualId ? { name: 'Premium', price: fallbackAnnualPrice, priceId: fallbackAnnualId } : null)
    : stripePlans.find(p => p.interval === 'year');
  const isPotentiallyEarlyBird = (subscriptionStatus === 'active' && planName === 'free');
  const chosenPlan: any = selectedInterval === 'year' ? annualPlan : monthlyPlan;
  const saving = monthlyPlan?.price && annualPlan?.price ? Math.max(0, (monthlyPlan.price * 12) - annualPlan.price) : 0;

  return (
    <div>
      {isLifetime && (
        <div className="mb-8 p-4 border-2 border-emerald-500 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200">
          <div className="font-semibold">Licença Vitalícia Ativa 🎉</div>
          <p className="text-sm mt-1">Sua conta possui acesso completo permanente. Não há cobranças recorrentes nem necessidade de renovação.</p>
        </div>
      )}

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
            </div>
            <div className="flex gap-2">
              {(subscriptionStatus === 'active' && planName === 'premium') && (
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

      {!isLifetime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>
      )}

      {!isLifetime && (
        <div className="grid grid-cols-1 gap-6">
          <div className={`border rounded-lg p-6 flex flex-col ${selectedInterval === 'year' ? 'border-purple-500' : 'dark:border-gray-700'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Premium</h3>
              <div className="inline-flex rounded-lg overflow-hidden border">
                <button type="button" className={`px-3 py-1 text-sm ${selectedInterval === 'month' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300'}`} onClick={() => setSelectedInterval('month')}>Mensal</button>
                <button type="button" className={`px-3 py-1 text-sm ${selectedInterval === 'year' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300'}`} onClick={() => setSelectedInterval('year')}>Anual</button>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">
              {chosenPlan?.price ? formatCurrency(chosenPlan.price) : '—'}
              <span className="text-sm font-normal text-gray-500">/{selectedInterval === 'year' ? 'ano' : 'mês'}</span>
            </p>
            {selectedInterval === 'year' && saving > 0 && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800 dark:text-green-300 font-medium">💰 Economia de {formatCurrency(saving)}</span>
                  <span className="text-xs text-green-600 dark:text-green-400">Economize no anual</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">Comparado ao mensal</p>
              </div>
            )}
            <ul className="space-y-2 my-6 text-sm flex-grow">
              {appConfig.subscription.plans.premium.features.map((f: string) => (
                <li key={f} className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/>{f}</li>
              ))}
            </ul>
            <button
              onClick={() => {
                const planId = (chosenPlan as any)?.priceId;
                if (!planId) return;
                (isCurrentlyPremium || isDevMode) ? handleChangePlan(planId) : handleSubscribe(planId);
              }}
              disabled={isCreatingSubscription || !(chosenPlan as any)?.priceId || (subscriptionStatus === 'active' && planName === 'premium' && currentInterval === (selectedInterval === 'year' ? 'year' : 'month'))}
              className={`w-full py-2 px-4 ${selectedInterval === 'year' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400`}
            >
              {isCreatingSubscription ? <Loader2 className="w-5 h-5 animate-spin"/> : <CreditCard className="w-5 h-5" />}
              {(subscriptionStatus === 'active' && planName === 'premium' && currentInterval === (selectedInterval === 'year' ? 'year' : 'month')) ? 'Plano Atual' : ((isCurrentlyPremium || isDevMode) ? (selectedInterval === 'year' ? 'Mudar para Anual' : 'Mudar para Mensal') : (selectedInterval === 'year' ? 'Assinar Anual' : 'Assinar Mensal'))}
            </button>
          </div>
        </div>
      )}

      {!isLifetime && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/40">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Tem um código vitalício?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Resgate sua licença vitalícia e tenha acesso completo para sempre.</p>
          <div className="flex gap-2 items-center max-w-lg">
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Digite seu código aqui"
              className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleRedeemLifetime}
              disabled={isRedeeming}
              className={`px-4 py-2 rounded-lg font-medium text-white ${isRedeeming ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isRedeeming ? 'Resgatando...' : 'Resgatar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansSection;
