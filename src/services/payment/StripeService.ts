import { loadStripe } from '@stripe/stripe-js';
import { appConfig } from '../../config/app.config';
import { supabaseService } from '../supabaseService';

// Interface simplificada para a criação da assinatura
interface SubscriptionOptions {
  priceId: string;
  email: string;
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

  async createSubscription(options: SubscriptionOptions) {
    try {
      if (!this.validateEmail(options.email)) {
        throw new Error('Email inválido');
      }
      if (!options.priceId) {
        throw new Error('Price ID do Stripe é obrigatório');
      }

      const { data: { session } } = await supabaseService.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não está autenticado');
      }

      const { data, error } = await supabaseService.functions.invoke('realm-stripe-function', {
        body: {
          action: 'create-checkout-session',
          priceId: options.priceId,
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

  async handlePaymentSuccess(sessionId: string): Promise<any> {
    const { data: { session } } = await supabaseService.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const { data, error } = await supabaseService.functions.invoke('realm-stripe-function', {
      body: {
        action: 'handle-payment-success',
        sessionId: sessionId,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) throw error;
    return data;
  }
}

export const stripeService = new StripeService();
