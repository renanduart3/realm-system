// supabase/functions/realm-stripe-function/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@v15.8.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});
// Initialize Supabase Admin Client
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Parse request body
  const { action, priceId, email, sessionId, siteUrl: siteUrlFromClient } = await req.json();
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Autenticação necessária'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Usuário não autenticado'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    // Handle different actions
    if (action === 'create-checkout-session') {
      // Validate required fields
      if (!priceId) {
        return new Response(JSON.stringify({
          error: 'priceId é obrigatório'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      if (!email) {
        return new Response(JSON.stringify({
          error: 'email é obrigatório'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      // Get or create Stripe customer
      let customerId;
      // Check if user already has a Stripe customer ID
      const { data: existingSubscription } = await supabaseAdmin.from('user_subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();
      if (existingSubscription?.stripe_customer_id) {
        customerId = existingSubscription.stripe_customer_id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            supabase_user_id: user.id
          }
        });
        customerId = customer.id;
      }
      // Get site URL from environment or infer from request headers; guard against string 'undefined'
      const envSite = Deno.env.get('SITE_URL');
      const headerOrigin = req.headers.get('origin') || req.headers.get('referer') || '';
      const normalizedFromClient = (siteUrlFromClient && typeof siteUrlFromClient === 'string') ? siteUrlFromClient.replace(/\/$/, '') : '';
      const siteUrl =
        (normalizedFromClient && /^https?:\/\//i.test(normalizedFromClient) ? normalizedFromClient : '') ||
        (envSite && envSite !== 'undefined' ? envSite : '') ||
        (headerOrigin ? headerOrigin.replace(/\/$/, '') : 'http://localhost:5173');
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: [
          'card'
        ],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/payment/cancel`,
        metadata: {
          supabase_user_id: user.id,
          user_email: email
        }
      });
      return new Response(JSON.stringify({
        url: session.url
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    if (action === 'handle-payment-success') {
      if (!sessionId) {
        return new Response(JSON.stringify({
          error: 'sessionId é obrigatório'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: [
          'subscription',
          'customer'
        ]
      });
      if (!session.subscription) {
        return new Response(JSON.stringify({
          error: 'Sessão não contém uma assinatura válida'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      const subscription = session.subscription;
      const customer = session.customer;
      // Update or insert user subscription in database
      const subscriptionData = {
        user_id: user.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan_name: 'premium',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      };
      const { error: upsertError } = await supabaseAdmin.from('user_subscriptions').upsert(subscriptionData, {
        onConflict: 'user_id'
      });
      if (upsertError) {
        console.error('Error updating subscription:', upsertError);
        return new Response(JSON.stringify({
          error: 'Erro ao salvar assinatura no banco de dados'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 500
        });
      }
      // Update user metadata
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          premium_status: subscription.status,
          plan_name: 'premium'
        }
      });
      return new Response(JSON.stringify({
        success: true,
        subscription: subscriptionData
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // Unknown action
    return new Response(JSON.stringify({
      error: `Ação não suportada: ${action}`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  } catch (error) {
    console.error('Error in realm-stripe-function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      details: error instanceof Error ? error.stack : undefined
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
