import { PaymentConfig, SubscriptionStatus } from '../../model/types';

export class MercadoPagoService {
  async createPreference(plan: string, billing: 'monthly' | 'yearly'): Promise<{ id: string }> {
    try {
      // TODO: Implementar integração real com MP
      return { id: 'mock_preference_id' };
    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      throw error;
    }
  }

  async createPayment(preferenceId: string, paymentData: {
    transaction_amount: number;
    payment_method_id: string;
    payer: { email: string };
  }) {
    const body = {
      ...paymentData,
      description: `Payment for preference ${preferenceId}`,
    };

    const requestOptions = {
      idempotencyKey: crypto.randomUUID(),
    };

    return await this.payment.create({ body, requestOptions });
  }
} 