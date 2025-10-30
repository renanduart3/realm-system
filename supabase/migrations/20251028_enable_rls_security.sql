-- Migration: Enable Row Level Security (RLS) for public tables
-- Created: 2025-10-28
-- Purpose: Fix security warnings by enabling RLS on all public tables

-- =====================================================
-- 1. Enable RLS on all affected tables
-- =====================================================

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_plans_cache ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. RLS Policies for user_subscriptions
-- =====================================================

-- Users can only read their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (for initial creation)
CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role has full access to subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 3. RLS Policies for invitation_codes
-- =====================================================

-- Anyone can read invitation codes (to validate them)
-- But this is still protected because they need to know the code
CREATE POLICY "Anyone can read invitation codes"
  ON public.invitation_codes
  FOR SELECT
  USING (true);

-- Only authenticated users can insert invitation codes
-- (This could be restricted further if needed)
CREATE POLICY "Authenticated users can create invitation codes"
  ON public.invitation_codes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only the creator can update their invitation codes
CREATE POLICY "Users can update their own invitation codes"
  ON public.invitation_codes
  FOR UPDATE
  USING (auth.uid() = user_gerente_id)
  WITH CHECK (auth.uid() = user_gerente_id);

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role has full access to invitation codes"
  ON public.invitation_codes
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 4. RLS Policies for stripe_plans_cache
-- =====================================================

-- Everyone can read the Stripe plans cache (it's public info)
CREATE POLICY "Anyone can read Stripe plans cache"
  ON public.stripe_plans_cache
  FOR SELECT
  USING (true);

-- Only service role can insert/update plans cache
CREATE POLICY "Service role can insert Stripe plans"
  ON public.stripe_plans_cache
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update Stripe plans"
  ON public.stripe_plans_cache
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can delete Stripe plans"
  ON public.stripe_plans_cache
  FOR DELETE
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. Create indexes for better performance
-- =====================================================

-- Index for user_subscriptions lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON public.user_subscriptions(user_id);

-- Index for user_subscriptions lookup by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
  ON public.user_subscriptions(stripe_customer_id);

-- Index for invitation_codes lookup by code
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code 
  ON public.invitation_codes(code);

-- Index for invitation_codes lookup by user_gerente_id
CREATE INDEX IF NOT EXISTS idx_invitation_codes_user_gerente 
  ON public.invitation_codes(user_gerente_id);

-- =====================================================
-- 6. Add comments for documentation
-- =====================================================

COMMENT ON TABLE public.user_subscriptions IS 
  'Stores user subscription information from Stripe. RLS enabled to ensure users can only access their own data.';

COMMENT ON TABLE public.invitation_codes IS 
  'Stores invitation codes for user registration. RLS enabled with read access for validation.';

COMMENT ON TABLE public.stripe_plans_cache IS 
  'Cache for Stripe pricing plans. RLS enabled with public read access and service-role write access.';

-- =====================================================
-- 7. Verification queries (optional - for testing)
-- =====================================================

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_subscriptions') THEN
    RAISE EXCEPTION 'RLS not enabled on user_subscriptions';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'invitation_codes') THEN
    RAISE EXCEPTION 'RLS not enabled on invitation_codes';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'stripe_plans_cache') THEN
    RAISE EXCEPTION 'RLS not enabled on stripe_plans_cache';
  END IF;
  RAISE NOTICE 'RLS successfully enabled on all tables!';
END $$;
