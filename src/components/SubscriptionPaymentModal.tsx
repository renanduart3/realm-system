import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { stripeService } from '../services/payment/StripeService';
import { useToast } from '../hooks/useToast';
import { appConfig } from '../config/app.config';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'month' | 'year';
  email: string;
  paymentMethod: 'card' | 'pix'; // Added paymentMethod property
}

export default function SubscriptionPaymentModal({ 
  isOpen, 
  onClose, 
  plan,
  email,
  paymentMethod // Accept paymentMethod as a prop
}: SubscriptionPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const planDetails = appConfig.subscription.plans.premium;
  const amount = plan === 'month' ? planDetails.price.monthly : planDetails.price.annual;

  // Calculate early bird discount if applicable
  const isEarlyBirdEligible = planDetails.earlyBirdDiscount?.enabled;
  const finalAmount = isEarlyBirdEligible
    ? amount * (1 - (planDetails.earlyBirdDiscount?.discountPercentage || 0) / 100)
    : amount;

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const session = await stripeService.createSubscription({
        planId: 'premium',
        interval: plan,
        email,
        paymentMethod
      });

      // Redirect to Stripe Checkout
      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao iniciar pagamento. Tente novamente.');
      showToast(
        'Erro ao iniciar pagamento. Por favor, tente novamente.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Confirmar Assinatura</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300">
            Plano: {plan === 'month' ? 'Mensal' : 'Anual'}
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(amount)}
          </p>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método de Pagamento:
          </h3>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                value="card" 
                checked={paymentMethod === 'card'} 
                readOnly 
                className="mr-2"
              />
              Cartão de Crédito
            </label>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Métodos de pagamento suportados:</p>
          <div className="flex space-x-2 mt-1">
            {appConfig.stripe.supportedPaymentMethods.map((method) => (
              <span
                key={method}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoading ? 'animate-pulse' : ''
            }`}
          >
            {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
