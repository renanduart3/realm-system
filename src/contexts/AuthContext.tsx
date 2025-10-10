import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User as SupabaseUser, AuthChangeEvent, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabaseService } from '../services/supabaseService'; // Import the supabase client
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
  logout: () => Promise<void>;
  updateOrganizationType: (type: 'profit' | 'nonprofit') => void; // Keep this for now
  // New subscription-related props
  subscriptionStatus: string | null;
  planName: string | null;
  isPremium: boolean;
  promptPlanSelection: boolean; // Added
  refreshSubscription: () => Promise<void>;
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
  
  // Debug logs
  console.log('🔍 AuthContext State:', {
    isAuthenticated,
    user: !!user,
    isPremium,
    subscriptionStatus,
    planName,
    isInitialized
  });

  useEffect(() => {
    // Initialize systemConfigService and load organizationType
    const initializeOrgType = async () => {
      try {
        await systemConfigService.initialize();
        const config = await systemConfigService.getConfig();
        if (config && config.organization_type) {
          setOrganizationType(config.organization_type);
        }
        const storedOrgType = localStorage.getItem('organization_type');
        if (storedOrgType) {
          setOrganizationType(storedOrgType as 'profit' | 'nonprofit');
        }
      } catch (error) {
        console.error('Error initializing organization type:', error);
      }
    };

    initializeOrgType();

    // CORREÇÃO: A função checkInitialSession foi removida.
    // O onAuthStateChange é a única fonte de verdade e lida com a sessão inicial automaticamente.
    
    // Initialize immediately if no session is expected
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabaseService.auth.getSession();
        console.log('Initial session check:', session);
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkInitialSession();

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
            }
          } catch (e) {
            console.error('Exception during metadata check/creation:', e);
            setSubscriptionStatus(null);
            setPlanName(null);
            console.log('❌ Setting isPremium to false - exception during metadata check');
            setIsPremium(false);
            setPromptPlanSelection(false);
          }

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
              console.log('❌ Setting isPremium to false - error fetching subscription');
              setIsPremium(false);
              setPromptPlanSelection(false); // Default to no prompt on error
            } else if (sub) {
              console.log('Subscription data found:', sub);
              setSubscriptionStatus(sub.status);
              setPlanName(sub.plan_name);
              const isActivePremium = sub.status === 'active' && sub.plan_name === 'premium';
              
              if (isActivePremium) {
                try {
                  console.log('Verifying premium subscription with Supabase function...');
                  const { data, error } = await supabaseService.functions.invoke('check-premium-subscription');
                  
                  if (error) throw error;

                  console.log('Premium verification result:', data);
                  
                  if (data.isPremium) {
                    console.log('✅ Setting isPremium to true');
                    setIsPremium(true);
                    console.log('Premium subscription verified successfully');
                  } else {
                    console.warn('❌ Premium verification failed:', data);
                    setIsPremium(false);
                  }
                } catch (verifyError) {
                  console.error('Error verifying premium subscription:', verifyError);
                  setIsPremium(isActivePremium);
                }
              } else {
                console.log('❌ Setting isPremium to false - not active premium');
                setIsPremium(false);
              }
              
              setPromptPlanSelection(sub.status === 'inactive'); // Prompt if inactive
            } else {
              console.log('No subscription record found for user (after metadata check). This might indicate an issue if user is new.');
              setSubscriptionStatus('inactive'); 
              setPlanName('free'); 
              console.log('❌ Setting isPremium to false - no subscription found');
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
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [isInitialized]);

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabaseService.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Erro ao fazer login com Google:', error);
        throw error;
      }

      console.log('Login com Google iniciado:', data);
    } catch (error) {
      console.error('Erro ao iniciar login com Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      setPlanName(null);
      setIsPremium(false);
      setPromptPlanSelection(false);
      
      const { error } = await supabaseService.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        throw error;
      }
      
      console.log('Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      setPlanName(null);
      setIsPremium(false);
      setPromptPlanSelection(false);
    }
  };
  
  const updateOrganizationType = async (type: 'profit' | 'nonprofit') => {
    setOrganizationType(type);
    localStorage.setItem('organization_type', type);
    try {
       // await systemConfigService.updateSheetId(type);
    } catch (error) {
        console.error("Error updating organization type in DB", error);
    }
  };

  const refreshSubscription = async () => {
    if (!session?.user) {
      console.log("Cannot refresh subscription, no user session.");
      return;
    }
    try {
      console.log('Refreshing subscription for user:', session.user.id);
      const { data: sub, error: subError } = await supabaseService
        .from('subscriptions')
        .select('status, plan_name')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subError) {
        console.error('Error refreshing subscription:', subError);
      } else if (sub) {
        console.log('Refreshed subscription data found:', sub);
        setSubscriptionStatus(sub.status);
        setPlanName(sub.plan_name);
        const isActivePremium = sub.status === 'active' && sub.plan_name === 'premium';
        setIsPremium(isActivePremium);
      } else {
        console.log('No subscription record found for user during refresh.');
      }
    } catch (e) {
      console.error('Exception during subscription refresh:', e);
    }
  };

  if (!isInitialized) {
    return <div>Loading authentication status...</div>; 
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      session,
      loginWithGoogle,
      logout,
      organizationType,
      updateOrganizationType,
      subscriptionStatus,
      planName,
      isPremium,
      promptPlanSelection,
      refreshSubscription
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
