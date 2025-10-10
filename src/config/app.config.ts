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
  useMockData: true,

  stripe: {
    publishableKey:
      "pk_test_51JDMMzJOXSa4N9iA96ooundiDvGr6JRSIDupuaBDaNxTcK3vx5bPBgXFGWZ3W0M3WQBvw1tVoy8iCrhaCfm2jSgE00L4lSd7xC",
    supportedPaymentMethods: ["card"],
  },

  subscription: {
    plans: {
      premium: {
        id: "premium",
        name: "Premium",
        description: "Acesso completo a todas as funcionalidades",
        price: {
          monthly: 19.9,
          annual: 190.0,
          monthlyPriceId: "price_1RUGeIJOXSa4N9iAgmMnkdng", // <--- Cole o ID do preço mensal
          annualPriceId: "price_1RUGdDJOXSa4N9iA1Ng10apM", // <--- Cole o ID do preço anual
        },
        features: [
          "Gestão completa de negócios",
          "Relatórios avançados",
          "Inteligência de negócios",
          "Exportação de dados",
          "Sincronização Google Sheets",
          "Backup na nuvem",
        ],
        earlyBirdDiscount: {
          enabled: true,
          maxUsers: 50,
          discountPercentage: 30,
        },
      } as SubscriptionPlan,
    },
  },
};
