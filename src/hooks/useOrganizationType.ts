import { useAuth } from '../contexts/AuthContext';

export function useOrganizationType() {
  const { organizationType } = useAuth();
  
  return {
    isProfit: organizationType === 'profit',
    isNonprofit: organizationType === 'nonprofit',
    organizationType
  };
} 