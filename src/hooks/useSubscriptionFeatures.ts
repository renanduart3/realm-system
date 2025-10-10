import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionState } from '../model/types';
import { subscriptionService } from '../services/subscriptionService';

export interface SubscriptionFeaturesState {
  isPremium: boolean;
  isLoading: boolean;
  plan: SubscriptionState['plan'];
}

const useSubscriptionFeatures = (): SubscriptionFeaturesState => {
  const { isAuthenticated, user } = useAuth();

  const features = useMemo(() => {
    const isPremium = subscriptionService.isPremium();
    
    return {
      isPremium,
      isLoading: false,
      plan: isPremium ? {
        id: 'premium',
        name: 'Plano Premium',
        type: 'premium' as const,
        features: ['Tudo do plano gratuito', 'Relatórios avançados', 'Backup na nuvem', 'Exportação de dados', 'Inteligência de negócio', 'Sincronização Google Sheets'],
        limitations: [],
        price: 29.90,
        billing: 'monthly' as const
      } : {
        id: 'free',
        name: 'Plano Gratuito',
        type: 'free' as const,
        features: ['Gestão de vendas', 'Gestão de estoque', 'Gestão de clientes', 'Relatórios visuais básicos'],
        limitations: ['Sem relatórios avançados', 'Sem inteligência de negócio', 'Sem backup na nuvem', 'Sem exportação de dados']
      }
    };
  }, [isAuthenticated, user]);

  return features;
};

export default useSubscriptionFeatures;