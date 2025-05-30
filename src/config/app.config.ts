interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  earlyBirdDiscount?: {
    enabled: boolean;
    maxUsers: number;
    discountPercentage: number;
  };
}

export const appConfig = {
  isDevelopment: true,
  requireAuth: true, 
  googleAuthEnabled: true,
  useMockData: false,
  
  stripe: {
    publishableKey: 'pk_test_51JDMMzJOXSa4N9iA96ooundiDvGr6JRSIDupuaBDaNxTcK3vx5bPBgXFGWZ3W0M3WQBvw1tVoy8iCrhaCfm2jSgE00L4lSd7xC',
    supportedPaymentMethods: ['card'],
  },

  subscription: {
    plans: {
      premium: {
        id: 'premium',
        name: 'Premium',
        description: 'Acesso completo a todas as funcionalidades',
        price: {
          monthly: 49.90,
          annual: 479.00  // ~20% discount for annual
        },
        features: [
          'Gestão completa de vendas',
          'Relatórios avançados',
          'Gestão de estoque',
          'Gestão de clientes',
          'Suporte prioritário',
          'Backup automático',
          'Exportação de dados'
        ],
        earlyBirdDiscount: {
          enabled: true,
          maxUsers: 50,
          discountPercentage: 30
        }
      } as SubscriptionPlan
    }
  }
};
