-- Supabase Schema for Realm App
-- This script defines the database structure for authentication, user profiles, and subscriptions.
-- Operational tables like products, sales, etc., are managed locally via Dexie.

-- Associated Edge Functions:
-- - `realm-stripe-function`: Handles creation of Stripe checkout sessions.
-- - `check-premium-subscription`: Securely verifies a user's subscription status.
-- - `stripe-webhook`: (Recommended) Handles webhooks from Stripe to update subscription status.

-- Helper function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table for user profiles, extending Supabase's auth.users table
-- This table stores additional user-specific information.
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text,
    role text CHECK (role IN ('master', 'seller')),
    nature_type text CHECK (nature_type IN ('profit', 'nonprofit')),
    updated_at timestamptz DEFAULT now()
);

-- Trigger to update the 'updated_at' timestamp on profile changes
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for user subscriptions to manage premium access
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text,
    plan text,
    interval text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean,
    stripe_subscription_id text UNIQUE,
    stripe_customer_id text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger to update the 'updated_at' timestamp on subscription changes
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for invitation codes (optional, server-side feature)
CREATE TABLE public.invitation_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    user_gerente_id uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

