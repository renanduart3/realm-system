import { SubscriptionPlan, PremiumReport, SubscriptionState } from '../model/types';

// Planos de assinatura
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    type: 'free',
    features: [
      'Gestão de vendas',
      'Gestão de estoque', 
      'Gestão de clientes',
      'Relatórios visuais básicos'
    ],
    limitations: [
      'Sem relatórios avançados',
      'Sem inteligência de negócio',
      'Sem backup na nuvem',
      'Sem exportação de dados'
    ]
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    type: 'premium',
    features: [
      'Tudo do plano gratuito',
      'Relatórios avançados',
      'Backup na nuvem',
      'Exportação de dados',
      'Inteligência de negócio',
      'Sincronização Google Sheets'
    ],
    limitations: [],
    price: 29.90,
    billing: 'monthly'
  }
];

// Relatórios premium disponíveis
export const PREMIUM_REPORTS: PremiumReport[] = [
  { 
    id: '1', 
    title: 'Relatório de Produtos Mais Vendidos', 
    description: 'Descubra quais produtos seus clientes mais amam.', 
    icon: 'trophy',
    category: 'products',
    isAvailable: true
  },
  { 
    id: '2', 
    title: 'Curva ABC de Produtos', 
    description: 'Classifique seus produtos pela importância nas vendas.', 
    icon: 'chart-pie',
    category: 'products',
    isAvailable: true
  },
  { 
    id: '3', 
    title: 'Análise de Vendas por Período', 
    description: 'Compare o desempenho de vendas ao longo do tempo.', 
    icon: 'chart-line',
    category: 'sales',
    isAvailable: true
  },
  { 
    id: '4', 
    title: 'Performance de Meios de Pagamento', 
    description: 'Entenda como seus clientes preferem pagar.', 
    icon: 'cash-register',
    category: 'analytics',
    isAvailable: true
  },
  { 
    id: '5', 
    title: 'Horários de Pico de Vendas', 
    description: 'Saiba os horários de maior movimento na sua loja.', 
    icon: 'clock',
    category: 'analytics',
    isAvailable: true
  },
  { 
    id: '6', 
    title: 'Ranking de Clientes (RFV)', 
    description: 'Identifique seus clientes mais valiosos.', 
    icon: 'users',
    category: 'clients',
    isAvailable: true
  },
  { 
    id: '7', 
    title: 'Clientes Inativos', 
    description: 'Crie campanhas para reativar clientes que não compram há algum tempo.', 
    icon: 'user-slash',
    category: 'clients',
    isAvailable: true
  },
  { 
    id: '8', 
    title: 'Análise de Margem de Lucro', 
    description: 'Descubra quais produtos são mais lucrativos.', 
    icon: 'dollar-sign',
    category: 'analytics',
    isAvailable: true
  }
];

export const subscriptionService = {
  // Obter plano atual
  async getCurrentPlan(): Promise<SubscriptionPlan> {
    const isPremium = this.isPremium();
    const planType = isPremium ? 'premium' : 'free';
    return SUBSCRIPTION_PLANS.find(plan => plan.type === planType) || SUBSCRIPTION_PLANS[0];
  },

  // Verificar se é premium (baseado na variável de ambiente)
  isPremium(): boolean {
    return import.meta.env.VITE_APP_SUBSCRIPTION_PREMIUM === 'true';
  },

  // Obter estado completo da assinatura
  async getSubscriptionState(): Promise<SubscriptionState> {
    try {
      const isPremium = this.isPremium();
      const plan = await this.getCurrentPlan();
      
      return {
        isPremium,
        plan,
        features: {
          canUseAdvancedReports: isPremium,
          canUseCloudBackup: isPremium,
          canUseBusinessIntelligence: isPremium,
          canUseGoogleSheetsSync: isPremium,
          canExportData: isPremium
        },
        isLoading: false
      };
    } catch (error) {
      console.error('Error getting subscription state:', error);
      return {
        isPremium: false,
        plan: SUBSCRIPTION_PLANS[0],
        features: {
          canUseAdvancedReports: false,
          canUseCloudBackup: false,
          canUseBusinessIntelligence: false,
          canUseGoogleSheetsSync: false,
          canExportData: false
        },
        isLoading: false
      };
    }
  },

  // Obter relatórios premium
  getPremiumReports(): PremiumReport[] {
    return PREMIUM_REPORTS;
  },

  // Obter relatórios por categoria
  getReportsByCategory(category: 'sales' | 'products' | 'clients' | 'analytics'): PremiumReport[] {
    return PREMIUM_REPORTS.filter(report => report.category === category);
  },

  // Verificar se funcionalidade está disponível
  canUseFeature(_feature: keyof SubscriptionState['features']): boolean {
    return this.isPremium();
  }
};
