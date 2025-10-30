import { db } from '../../db/AppDatabase';
import { PaymentConfig,PaymentProvider, CachedSubscriptionStatus, PaymentError } from '../../model/types';
import { loadStripe } from '@stripe/stripe-js';

export class PaymentService {
  private static instance: PaymentService;
  private config: PaymentConfig;
  private lastError?: PaymentError;
  private stripe: any;

  private constructor() {
    this.config = {
      provider: import.meta.env.VITE_PAYMENT_PROVIDER as PaymentProvider,
      apiKey: import.meta.env.VITE_PAYMENT_API_KEY,
      environment: import.meta.env.MODE as 'development' | 'production'
    };
    this.initializeStripe();
  }

  private async initializeStripe() {
    if (this.config.provider === 'stripe') {
      this.stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    }
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async getSubscriptionStatus(): Promise<CachedSubscriptionStatus | null> {
    try {
      // Primeiro tenta pegar do cache local
      const cachedStatus = await this.getCachedStatus();
      if (cachedStatus && this.isStatusValid(cachedStatus)) {
        return cachedStatus;
      }

      // Se não tiver cache ou estiver expirado, busca da API
      const status = await this.fetchStatusFromAPI();
      if (status) {
        // Ensure the fetched status has the correct id for caching
        const statusToCache: CachedSubscriptionStatus = {
          ...status, // Spread the fetched status
          id: 'currentUser', // Ensure id is 'currentUser'
          lastSync: new Date().toISOString(), // Update lastSync
        };
        await this.cacheStatus(statusToCache);
        return statusToCache;
      }

      return null;
    } catch (error) {
      this.handleError(error);
      // Attempt to return cached status on API error, could be stale
      return this.getCachedStatus(); 
    }
  }

  private async getCachedStatus(): Promise<CachedSubscriptionStatus | null> {
    try {
      const status = await (getDbEngine() as any).getSubscriptionStatus?.('currentUser');
      return status || null;
    } catch {
      return null; // Or handle error more specifically
    }
  }

  private async cacheStatus(status: Partial<CachedSubscriptionStatus>): Promise<void> {
    try {
      // Ensure essential fields are present
      const currentStatusToSave: CachedSubscriptionStatus = {
        id: 'currentUser',
        status: status.status || 'none',
        planName: status.planName || 'free',
        lastSync: new Date().toISOString(),
        ...status, // Spread the provided status, potentially overwriting defaults if present
      };
      await (getDbEngine() as any).putSubscriptionStatus?.(currentStatusToSave);
    } catch (error) {
      console.error('Error caching subscription status:', error);
    }
  }

  private isStatusValid(status: CachedSubscriptionStatus): boolean {
    if (!status.lastSync) return false; // If lastSync is missing, consider invalid
    const lastSync = new Date(status.lastSync);
    const now = new Date();
    // Considera válido se a última sincronização foi há menos de 1 hora
    return now.getTime() - lastSync.getTime() < 60 * 60 * 1000;
  }

  private async fetchStatusFromAPI(): Promise<CachedSubscriptionStatus | null> {
    // Implementar integração específica com Mercado Pago ou Pagar.me
    // This is a placeholder. The actual implementation would fetch from Stripe (or other provider)
    // and map the response to CachedSubscriptionStatus.
    if (this.config.provider === 'mercadopago') {
      return this.fetchMercadoPagoStatus(); // Placeholder
    } else {
      // Assuming PagarMe or Stripe, needs actual implementation
      return this.fetchPagarMeStatus(); // Placeholder, should map to CachedSubscriptionStatus
    }
  }

  private handleError(error: any): void {
    this.lastError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date().toISOString()
    };

    if (this.config.environment === 'development') {
      console.error('Payment Service Error:', error);
    }
  }

  // Implementações específicas para cada provedor (Placeholders)
  private async fetchMercadoPagoStatus(): Promise<CachedSubscriptionStatus | null> {
    // TODO: Implement actual API call and map response to CachedSubscriptionStatus
    console.warn('fetchMercadoPagoStatus not implemented');
    return null;
  }

  private async fetchPagarMeStatus(): Promise<CachedSubscriptionStatus | null> {
    if (this.config.provider !== 'stripe') {
      return null;
    }

    try {
      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      
      return {
        id: 'currentUser',
        status: data.status,
        planName: data.plan,
        interval: data.interval,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripeCustomerId: data.stripe_customer_id,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  async createSubscription(priceId: string): Promise<{ sessionId: string } | null> {
    if (this.config.provider !== 'stripe') {
      throw new Error('Stripe provider not configured');
    }

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { sessionId } = await response.json();
      return { sessionId };
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    if (this.config.provider !== 'stripe') {
      throw new Error('Stripe provider not configured');
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  async redirectToCheckout(sessionId: string): Promise<boolean> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error } = await this.stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }
} 

