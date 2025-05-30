import React, { useState, useEffect } from 'react'; // useEffect might be needed for specific UI updates, keep for now
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { appConfig } from '../config/app.config';
import { stripeService } from '../services/payment/StripeService';
// PaymentService and CachedSubscriptionStatus removed
import { useToast } from '../hooks/useToast';
import SubscriptionPaymentModal from '../components/SubscriptionPaymentModal';
import { useAuth } from '../contexts/AuthContext'; // Already here, will use more from it

// Old interface definition removed

export default function SubscriptionStatus() {
  // Local states 'subscription' and 'isLoading' removed
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanInterval, setSelectedPlanInterval] = useState<'month' | 'year'>('month');
  // selectedPaymentMethod state removed

  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const { 
    user, 
    isAuthenticated, 
    isPremium, // isPremium from AuthContext
    planName: planNameFromAuth, // planName from AuthContext
    subscriptionStatus: statusFromAuth, // subscriptionStatus from AuthContext
    promptPlanSelection 
  } = useAuth();

  const planDetails = appConfig.subscription.plans.premium;
  // paymentService instance removed
  // useEffect calling loadSubscriptionStatus removed
  // loadSubscriptionStatus function removed

  const handleSubscribe = (interval: 'month' | 'year') => {
    if (!user?.email) {
      showToast('Please log in to subscribe.', 'error');
      navigate('/login');
      return;
    }
    setSelectedPlanInterval(interval); // Updated state variable name
    setShowPaymentModal(true);
    // TODO: Comment clearly that after Stripe payment, a backend process (webhook) 
    // is needed to update Supabase, and then AuthContext will refresh.
  };

  const handleCancelSubscription = async () => {
    // TODO: This function needs stripeSubscriptionId from AuthContext, which is currently not provided.
    // For now, this button might be disabled or show a message if that ID isn't available.
    // Also, add comment about backend webhook being the source of truth for Supabase update.
    showToast('Cancellation logic needs AuthContext to provide Stripe Subscription ID.', 'warning');
    
    // Example of what it might look like if stripeSubscriptionId were available:
    // const stripeSubIdFromAuth = user?.subscription?.stripeSubscriptionId; // Hypothetical
    // if (!isPremium || !stripeSubIdFromAuth) {
    //   showToast('No active premium subscription to cancel or subscription ID is missing.', 'error');
    //   return;
    // }
    // try {
    //   // Consider adding a local loading state for this operation if needed
    //   await stripeService.cancelSubscription(stripeSubIdFromAuth);
    //   showToast('Subscription cancellation requested. Status will update once processed by the server.', 'success');
    //   // AuthContext will eventually pick up the change from Supabase after webhook processing.
    // } catch (error) {
    //   console.error('Error cancelling subscription:', error);
    //   showToast('Error cancelling subscription. Please try again.', 'error');
    // }
  };

  if (!isAuthenticated && !user) { // Show loading if auth state is not yet determined
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Subscription Status
      </h1>

      {/* Case 1: User needs to select a plan (e.g., status 'inactive' or prompt flag is true) */}
      {(statusFromAuth === 'inactive' || promptPlanSelection) && isAuthenticated && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Complete Your Subscription
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please select a plan to continue using our services. Your current status is '{statusFromAuth}'.
          </p>
          {/* Plan selection cards - similar to original but without free plan if status is 'inactive' */}
          {/* Payment method selection UI removed */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Premium Monthly Plan Card */}
            <div className="border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Monthly
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCurrency(planDetails.price.monthly)}/month
              </p>
              <ul className="space-y-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('month')}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Subscribe Monthly
              </button>
            </div>

            {/* Premium Annual Plan Card */}
            <div className="border dark:border-gray-700 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                Save 20%
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Annual
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCurrency(planDetails.price.annual)}/year
              </p>
              <ul className="space-y-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('year')}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Subscribe Annually
              </button>
            </div>
          </div>
           {/* Early bird discount can still be shown if applicable based on appConfig */}
           {planDetails.earlyBirdDiscount?.enabled && (
             <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
               <p className="text-blue-700 dark:text-blue-300 font-medium">🎉 Early Bird Offer!</p>
               <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                 Get {planDetails.earlyBirdDiscount.discountPercentage}% off when you subscribe now! 
                 Limited to first {planDetails.earlyBirdDiscount.maxUsers} subscribers.
               </p>
             </div>
           )}
        </div>
      )}

      {/* Case 2: User has an active free plan */}
      {isAuthenticated && statusFromAuth === 'active' && planNameFromAuth === 'free' && !promptPlanSelection && (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Current Plan: Free
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upgrade to Premium to unlock all features.
          </p>
          {/* Display Premium plan cards for upgrade */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Premium Monthly Plan Card (same as above) */}
            <div className="border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Monthly
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCurrency(planDetails.price.monthly)}/month
              </p>
              <ul className="space-y-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSubscribe('month')} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Upgrade to Monthly
              </button>
            </div>
            {/* Premium Annual Plan Card (same as above) */}
            <div className="border dark:border-gray-700 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">Save 20%</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Annual
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCurrency(planDetails.price.annual)}/year
              </p>
              <ul className="space-y-2 mb-6">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSubscribe('year')} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Upgrade to Annually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case 3: User has an active premium plan */}
      {isAuthenticated && isPremium && statusFromAuth === 'active' && !promptPlanSelection && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Current Subscription: Premium
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              Active
            </span>
          </div>
          {/* TODO: Display renewal date (currentPeriodEnd) and cancelAtPeriodEnd status if available from AuthContext */}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You have full access to all premium features.
            {/* Placeholder for renewal info: "Your subscription will renew on [date]." */}
            {/* Placeholder for cancellation info: "Your subscription is set to cancel on [date]." */}
          </p>
          <button
            onClick={handleCancelSubscription}
            // TODO: Disable if stripeSubscriptionId is not available from AuthContext
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:hover:bg-red-900/20"
          >
            Cancel Subscription
          </button>
        </div>
      )}
      
      {/* Case 4: User has a non-active status other than 'inactive' (e.g. 'past_due', 'canceled') */}
      {isAuthenticated && statusFromAuth && !['active', 'inactive'].includes(statusFromAuth) && !promptPlanSelection && (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Subscription Status: {statusFromAuth.charAt(0).toUpperCase() + statusFromAuth.slice(1)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your <span className="font-semibold">{planNameFromAuth}</span> plan is currently {statusFromAuth}. 
              {/* TODO: Provide more specific guidance based on status, e.g., link to update payment for 'past_due' */}
              Please manage your subscription or contact support if you have questions.
            </p>
             {/* Optionally, show manage subscription button or contact support */}
         </div>
      )}


      {showPaymentModal && (
        <SubscriptionPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlanInterval} // Updated prop name
          email={user?.email || ''}
          paymentMethod={'card'} // Hardcoded as 'card'
        />
      )}
    </div>
  );
}
