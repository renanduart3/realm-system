import { loadStripe } from '@stripe/stripe-js';
import { appConfig } from '../../config/app.config';

type PlanId = keyof typeof appConfig.subscription.plans;
type PaymentMode = 'payment' | 'subscription';
type PaymentInterval = 'month' | 'year';
type PaymentMethod = 'card' | 'pix';

interface PaymentSessionOptions {
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  mode?: PaymentMode;
  subscriptionData?: {
    planId: PlanId;
    interval: PaymentInterval;
  };
}

interface SubscriptionOptions {
  planId: PlanId;
  interval: PaymentInterval;
  email: string;
  paymentMethod: PaymentMethod; // Added paymentMethod property
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

  private validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 999999.99;
  }

  // async createPaymentSession(options: PaymentSessionOptions) {
  //   try {
  //     const stripe = await this.stripe;
      
  //     // Base configuration for the session
  //     const sessionConfig = {
  //       mode: options.mode || 'payment',
  //       payment_method_types: options.paymentMethod ? 
  //         [options.paymentMethod] : 
  //         appConfig.stripe.supportedPaymentMethods,
  //       line_items: [{
  //         price_data: {
  //           currency: options.currency || 'brl',
  //           product_data: {
  //             name: options.subscriptionData ? 
  //               `${appConfig.subscription.plans.premium.name} - $ {
  //                 options.subscriptionData.interval === 'month' ? 'Mensal' : 'Anual'
  //               }` : 
  //               'Pagamento',
  //           },
  //           unit_amount: options.amount * 100, // Stripe expects amount in cents
  //           recurring: options.subscriptionData ? {
  //             interval: options.subscriptionData.interval,
  //           } : undefined,
  //         },
  //         quantity: 1,
  //       }],
  //       success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  //       cancel_url: `${window.location.origin}/payment/cancel`,
  //     };

  //     // Create the session
  //     const session = await stripe.checkout.sessions.create(sessionConfig);
      
  //     return session;
  //   } catch (error) {
  //     console.error('Error creating payment session:', error);
  //     throw error;
  //   }
  // }

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
      const amount = options.interval === 'month' ? 
        plan.price.monthly : 
        plan.price.annual;

      if (!this.validateAmount(amount)) {
        throw new Error('Valor inválido para o plano');
      }

      // Apply early bird discount if eligible
      let finalAmount = amount;
      if (plan.earlyBirdDiscount?.enabled) {
        // TODO: Check if user is eligible for early bird discount
        // This would require checking how many subscriptions have been created
        finalAmount = amount * (1 - plan.earlyBirdDiscount.discountPercentage / 100);
      }

      // TODO: Add userId if available
      const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/realm-stripe-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-checkout-session',
          planId: options.planId,
          interval: options.interval,
          email: options.email,
          paymentMethod: options.paymentMethod,
          // userId: options.userId // Optional: pass if available
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create Stripe checkout session');
      }

      if (!data.url) {
        throw new Error('No session URL returned from backend');
      }
      
      return { url: data.url }; // Return object with URL property for consistency
    } catch (error) {
      console.error('Erro ao criar assinatura:', {
        error,
        options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async handlePaymentSuccess(sessionId: string) {
    try {
      // const stripe = await this.stripe;
      // const session = await stripe.checkout.sessions.retrieve(sessionId);
      const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/realm-stripe-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify-session',
          sessionId: sessionId,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to verify Stripe session');
      }
      
      // Handle successful payment
      // TODO: Update user's subscription status in the database
      // TODO: Send confirmation email
      // TODO: Update UI to reflect new subscription status
      
      return data; // Return session details from backend
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      // const stripe = await this.stripe;
      // const subscription = await stripe.subscriptions.cancel(subscriptionId);
      // TODO: Add userId if available
      const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/realm-stripe-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel-subscription',
          subscriptionId,
          // userId: options.userId // Optional: pass if available
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      // TODO: Update user's subscription status in the database
      // TODO: Send cancellation confirmation email
      // TODO: Update UI to reflect cancelled subscription
      
      return data.success; // Return success status
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(subscriptionId: string) {
    try {
      // const stripe = await this.stripe;
      // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      // TODO: Add userId if available, might be part of the query or body
      const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/realm-stripe-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-subscription-status',
          subscriptionId,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get subscription status');
      }
      return data; // Return subscription details from backend
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
