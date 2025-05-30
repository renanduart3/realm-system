import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User as SupabaseUser, AuthChangeEvent, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabaseService } from '../services/supabaseService'; // Import the supabase client
import { appConfig } from '../config/app.config'; // Keep for isDevelopment, though login logic changes
import { systemConfigService } from '../services/systemConfigService'; // Keep for organizationType for now

// Define the shape of the user object you want to expose from the context.
// For now, it will be the SupabaseUser, but you might extend it later with profile data.
export type User = SupabaseUser;

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  session: SupabaseSession | null; // Expose session if needed
  organizationType: 'profit' | 'nonprofit'; // Keep this for now
  loginWithGoogle: () => Promise<void>;
  // signUpWithEmailPassword and signInWithEmailPassword removed
  logout: () => Promise<void>;
  updateOrganizationType: (type: 'profit' | 'nonprofit') => void; // Keep this for now
  // New subscription-related props
  subscriptionStatus: string | null;
  planName: string | null;
  isPremium: boolean;
  promptPlanSelection: boolean; // Added
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [organizationType, setOrganizationType] = useState<'profit' | 'nonprofit'>('profit');
  const [isInitialized, setIsInitialized] = useState(false); // To prevent rendering before auth state is known
  // New state variables for subscription
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [promptPlanSelection, setPromptPlanSelection] = useState<boolean>(false); // Added

  useEffect(() => {
    // Initialize systemConfigService and load organizationType (existing logic)
    const initializeOrgType = async () => {
      try {
        await systemConfigService.initialize();
        const config = await systemConfigService.getConfig();
        if (config && config.organization_type) {
          setOrganizationType(config.organization_type);
        }
        // Also load from localStorage as a fallback or initial value if service is slow
        const storedOrgType = localStorage.getItem('organization_type');
        if (storedOrgType) {
          setOrganizationType(storedOrgType as 'profit' | 'nonprofit');
        }
      } catch (error) {
        console.error('Error initializing organization type:', error);
      }
    };

    initializeOrgType();

    // Supabase auth state change listener
    const { data: authListener } = supabaseService.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: SupabaseSession | null) => {
        console.log('Supabase Auth Event:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: existingMetadata, error: fetchError } = await supabaseService
              .from('users_metadata')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();

            if (fetchError) {
              console.error('Error fetching user metadata:', fetchError);
            } else if (!existingMetadata) {
              console.log('No existing metadata found for user, creating new record...');
              const isGoogle = session.user.app_metadata.provider === 'google';
              const name = isGoogle
                ? session.user.user_metadata.full_name || session.user.user_metadata.name
                : session.user.email; // Default to email if not Google and name not available

              const { error: insertError } = await supabaseService
                .from('users_metadata')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  name: name, // Use determined name
                  google_user: isGoogle,
                });

              if (insertError) {
                console.error('Error inserting user metadata:', insertError);
              } else {
                console.log('User metadata created successfully for', session.user.email, '. Now creating default free subscription.');
                
                const { error: subInsertError } = await supabaseService
                  .from('subscriptions')
                  .insert({
                    user_id: session.user.id,
                    status: 'active',
                    plan_name: 'free',
                  });

                if (subInsertError) {
                  console.error('Error creating default free subscription:', subInsertError);
                } else {
                  console.log('Default free subscription created for user:', session.user.id);
                  setSubscriptionStatus('active');
                  setPlanName('free');
                  setIsPremium(false);
                  setPromptPlanSelection(false); // User gets a free active plan
                }
              }
            } else { // User metadata already exists
              console.log('User metadata already exists for', session.user.email);
              // Proceed to fetch subscription for existing user (logic below will handle it)
            }
          } catch (e) {
            console.error('Exception during metadata check/creation:', e);
            // Fallback if metadata check fails - assume no premium, no prompt
            setSubscriptionStatus(null);
            setPlanName(null);
            setIsPremium(false);
            setPromptPlanSelection(false);
          }

          // Fetch subscription status (this will run for both new users after metadata/default sub creation, and existing users)
          try {
            console.log('Fetching subscription for user:', session.user.id);
            const { data: sub, error: subError } = await supabaseService
              .from('subscriptions')
              .select('status, plan_name')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (subError) {
              console.error('Error fetching subscription:', subError);
              setSubscriptionStatus(null);
              setPlanName(null);
              setIsPremium(false);
              setPromptPlanSelection(false); // Default to no prompt on error
            } else if (sub) {
              console.log('Subscription data found:', sub);
              setSubscriptionStatus(sub.status);
              setPlanName(sub.plan_name);
              const isActivePremium = sub.status === 'active' && sub.plan_name === 'premium';
              
              // Verify premium status using Supabase function
              if (isActivePremium) {
                try {
                  console.log('Verifying premium subscription with Supabase function...');
                  const response = await fetch('https://ndjiinwbcsccutkfkprb.supabase.co/functions/v1/check-premium-subscription', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      user_id: session.user.id
                    }),
                  });
                  
                  const verificationResult = await response.json();
                  console.log('Premium verification result:', verificationResult);
                  
                  if (response.ok && verificationResult.isPremium) {
                    setIsPremium(true);
                    console.log('Premium subscription verified successfully');
                  } else {
                    console.warn('Premium verification failed:', verificationResult);
                    setIsPremium(false);
                  }
                } catch (verifyError) {
                  console.error('Error verifying premium subscription:', verifyError);
                  // Fallback to local database check if verification fails
                  setIsPremium(isActivePremium);
                }
              } else {
                setIsPremium(false);
              }
              
              setPromptPlanSelection(sub.status === 'inactive'); // Prompt if inactive
            } else {
              // This 'else' block should ideally not be reached if a new user always gets a default 'free'/'active' sub created above.
              // However, if it IS reached (e.g. metadata existed, but sub record was manually deleted or creation failed silently earlier)
              console.log('No subscription record found for user (after metadata check). This might indicate an issue if user is new.');
              setSubscriptionStatus('inactive'); 
              setPlanName('free'); 
              setIsPremium(false);
              setPromptPlanSelection(true); // No sub found, prompt to select.
            }
          } catch (e) {
            console.error('Exception during subscription fetch:', e);
            setSubscriptionStatus(null);
            setPlanName(null);
            setIsPremium(false);
            setPromptPlanSelection(false); // Default to no prompt on error
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear subscription status on sign out
          setSubscriptionStatus(null);
          setPlanName(null);
          setIsPremium(false);
          setPromptPlanSelection(false); // Reset prompt on sign out
        }
        
        // If it's the initial session load, mark as initialized
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    );
    
    // Check initial session
     const checkInitialSession = async () => {
      const { data: { session: initialSession } } = await supabaseService.auth.getSession();
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        setIsAuthenticated(true);
      }
      setIsInitialized(true); // Mark as initialized after checking
    };
    checkInitialSession();


    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [isInitialized]); // Added isInitialized to dependencies

  const loginWithGoogle = async () => {
    const { error } = await supabaseService.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error logging in with Google:', error);
      // Handle error (e.g., show toast to user)
    }
  };

  // signUpWithEmailPassword and signInWithEmailPassword functions removed

  const logout = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      setPlanName(null);
      setIsPremium(false);
      setPromptPlanSelection(false);
      
      // Sign out from Supabase
      const { error } = await supabaseService.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        throw error;
      }
      
      console.log('Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, we want to clear local state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      setPlanName(null);
      setIsPremium(false);
      setPromptPlanSelection(false);
    }
  };
  
  // Keep existing organization type update logic
  const updateOrganizationType = async (type: 'profit' | 'nonprofit') => {
    setOrganizationType(type);
    localStorage.setItem('organization_type', type); // Keep local storage for immediate UI, sync with DB if needed
    try {
       // await systemConfigService.updateSheetId(type);
    } catch (error) {
        console.error("Error updating organization type in DB", error);
    }
    // window.location.reload(); // Consider if reload is still needed or if UI can react to state change
  };

  // Render a loading state or null until Supabase has checked the session
  if (!isInitialized) {
    // You can return a global loading spinner here if you prefer
    return <div>Loading authentication status...</div>; 
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      session,
      loginWithGoogle,
      // signUpWithEmailPassword, // Removed
      // signInWithEmailPassword, // Removed
      logout,
      organizationType, // Keep
      updateOrganizationType, // Keep
      // Add new subscription values to provider
      subscriptionStatus,
      planName,
      isPremium,
      promptPlanSelection // Added
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
