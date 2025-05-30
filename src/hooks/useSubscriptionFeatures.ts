import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { CachedSubscriptionStatus } from '../model/types'; // Keep for type if needed

export interface SubscriptionFeaturesState {
  isPremium: boolean;
  canUseCloudBackup: boolean;
  canUseBusinessIntelligence: boolean;
  canUseScheduling: boolean; // For future use
  isLoading: boolean;
  subscriptionStatus: CachedSubscriptionStatus | null; // The raw status object
}

const useSubscriptionFeatures = (): SubscriptionFeaturesState => {
  const [features, setFeatures] = useState<SubscriptionFeaturesState>({
    isPremium: false,
    canUseCloudBackup: false,
    canUseBusinessIntelligence: false,
    canUseScheduling: false,
    isLoading: true, // Initial loading state
    subscriptionStatus: null,
  });

  const { 
    isPremium: isPremiumFromAuth, 
    planName: planNameFromAuth, 
    subscriptionStatus: statusStringFromAuth, // This is string | null
    isAuthenticated, 
    user 
  } = useAuth();

  useEffect(() => {
    // isLoading is true if not authenticated or user object is not yet available.
    // AuthContext's isInitialized state handles its own loading, so by the time we get here,
    // isAuthenticated and user should be stable for the current auth state.
    const isLoading = !isAuthenticated || !user; 

    if (isLoading) {
      setFeatures({
        isPremium: false,
        canUseCloudBackup: false,
        canUseBusinessIntelligence: false,
        canUseScheduling: false,
        isLoading: true,
        subscriptionStatus: null,
      });
      return;
    }

    // Adapt subscription status from AuthContext to CachedSubscriptionStatus format
    let adaptedStatus: CachedSubscriptionStatus | null = null;
    if (user && statusStringFromAuth) {
        adaptedStatus = {
            id: user.id, // Using user.id as a stand-in for subscription id or a general id
            userId: user.id,
            status: statusStringFromAuth as CachedSubscriptionStatus['status'], // Cast if necessary
            planName: planNameFromAuth as CachedSubscriptionStatus['planName'], // Cast if necessary
            // Fields like interval, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, 
            // stripeSubscriptionId, stripeCustomerId are not available directly from useAuth's current exposure.
            // These would need to be added to AuthContext or this hook needs to simplify its concept of "subscriptionStatus".
            lastSync: new Date().toISOString(), // Placeholder for lastSync
        };
    }

    setFeatures({
      isPremium: isPremiumFromAuth,
      canUseCloudBackup: isPremiumFromAuth, // Tied to premium status from AuthContext
      canUseBusinessIntelligence: isPremiumFromAuth, // Tied to premium status from AuthContext
      canUseScheduling: isPremiumFromAuth, // Assuming tied to premium for now
      isLoading: false, // Data processed, loading is false
      subscriptionStatus: adaptedStatus, 
    });

  }, [isPremiumFromAuth, planNameFromAuth, statusStringFromAuth, isAuthenticated, user]);

  return features;
};

export default useSubscriptionFeatures;
