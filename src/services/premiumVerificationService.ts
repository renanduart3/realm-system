
import { supabaseService } from './supabaseService';

export interface PremiumVerificationResult {
  isPremium: boolean;
  planName?: string;
  status?: string;
  message?: string;
  error?: string;
}

export const premiumVerificationService = {
  /**
   * Verify premium subscription status using Supabase function
   */
  async verifyPremiumSubscription(userId: string): Promise<PremiumVerificationResult> {
    try {
      console.log('Verifying premium subscription for user:', userId);
      
      // Get current session for authorization
      const { data: { session } } = await supabaseService.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/check-premium-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      const result = await response.json();
      console.log('Premium verification API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify premium subscription');
      }

      return {
        isPremium: result.isPremium || false,
        planName: result.planName,
        status: result.status,
        message: result.message,
      };
    } catch (error) {
      console.error('Error in premium verification service:', error);
      return {
        isPremium: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Quick check - can be used in components that need to verify premium status
   */
  async quickPremiumCheck(): Promise<boolean> {
    try {
      const { data: { session } } = await supabaseService.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const result = await this.verifyPremiumSubscription(session.user.id);
      return result.isPremium;
    } catch (error) {
      console.error('Quick premium check failed:', error);
      return false;
    }
  }
};
