import { loadStripe } from '@stripe/stripe-js';
import { appConfig } from '../../config/app.config';
import { supabaseService } from '../supabaseService';

type PlanId = keyof typeof appConfig.subscription.plans;
type PaymentInterval = 'month' | 'year';

interface SubscriptionOptions {
  planId: PlanId;
  interval: PaymentInterval;
  email: string;
  paymentMethod: 'card';
}

class StripeService {
  private stripe: Promise<any>;
  private readonly VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor() {
    this.stripe = loadStripe(appConfig.stripe.publishableKey);
  }

  private validateEmail(email: string): boolean {
    return this.VALID_EMAIL_REGEX.test(email);
  }

  private validatePlanId(planId: PlanId): boolean {
    return planId in appConfig.subscription.plans;
  }

  async createSubscription(options: SubscriptionOptions) {
    try {
      // Validações
      if (!this.validateEmail(options.email)) {
        throw new Error('Email inválido');
      }

      if (!this.validatePlanId(options.planId)) {
        throw new Error('Plano inválido');
      }

      const plan = appConfig.subscription.plans[options.planId];
      const priceId = options.interval === 'month' ?
        plan.price.monthlyPriceId :
        plan.price.annualPriceId;

      // Obter a sessão atual do Supabase
      const { data: { session } } = await supabaseService.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não está autenticado');
      }

      // Usar o cliente Supabase para chamar a Edge Function
      const { data, error } = await supabaseService.functions.invoke('realm-stripe-function', {
        body: {
          action: 'create-checkout-session',
          priceId,
          email: options.email
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar sessão de checkout');
      }

      if (!data?.url) {
        throw new Error('URL de checkout não retornada pelo servidor');
      }
      
      return { url: data.url };
    } catch (error) {
      console.error('Erro ao criar assinatura:', {
        error,
        options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

export const stripeService = new StripeService();
