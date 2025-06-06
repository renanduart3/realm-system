import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { appConfig } from '../config/app.config';
import { stripeService } from '../services/payment/StripeService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionStatus() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const { 
    user, 
    isAuthenticated, 
    isPremium,
    planName: planNameFromAuth,
    subscriptionStatus: statusFromAuth,
  } = useAuth();

  const planDetails = appConfig.subscription.plans.premium;

  const handleSubscribe = async (interval: 'month' | 'year') => {
    if (!user?.email) {
      showToast('Por favor, faça login para assinar.', 'error');
      navigate('/login');
      return;
    }

    try {
      const stripeSession = await stripeService.createSubscription({
        planId: 'premium',
        interval,
        email: user.email,
        paymentMethod: 'card',
      });

      if (stripeSession?.url) {
        window.location.href = stripeSession.url;
      } else {
        showToast('Não foi possível iniciar o processo de assinatura. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar sessão do Stripe:', error);
      showToast('Erro ao iniciar assinatura. Tente novamente mais tarde.', 'error');
    }
  };

  if (!isAuthenticated && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Status da Assinatura</h1>

      {isAuthenticated && statusFromAuth === 'active' && planNameFromAuth === 'premium' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Assinatura Premium Ativa
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              Ativa
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Você tem acesso completo a todos os recursos premium.
          </p>
        </div>
      )}

      {isAuthenticated && (statusFromAuth !== 'active' || planNameFromAuth !== 'premium') && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Escolha seu Plano Premium
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Desbloqueie todos os recursos com uma assinatura premium.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Plano Mensal */}
            <div className="border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Mensal
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCurrency(planDetails.price.monthly)}/mês
              </p>
              <ul className="space-y-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('month')}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Assinar Mensal
              </button>
            </div>

            {/* Plano Anual */}
            <div className="border dark:border-gray-700 rounded-lg p-6 relative">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                Economize 20%
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Anual
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCurrency(planDetails.price.annual)}/ano
              </p>
              <ul className="space-y-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('year')}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Assinar Anual
              </button>
            </div>
          </div>

          {planDetails.earlyBirdDiscount?.enabled && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-700 dark:text-blue-300 font-medium">🎉 Oferta Early Bird!</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                Ganhe {planDetails.earlyBirdDiscount.discountPercentage}% de desconto ao assinar agora! 
                Limitado aos primeiros {planDetails.earlyBirdDiscount.maxUsers} assinantes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
