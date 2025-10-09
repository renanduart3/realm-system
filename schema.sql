-- Supabase Schema for Realm App
-- This script defines the database structure for the application.

-- Helper function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table for system-wide configuration
-- This table stores settings related to the organization and application behavior.
CREATE TABLE public.system_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_type text CHECK (organization_type IN ('profit', 'nonprofit')),
    organization_name text,
    currency text,
    theme text CHECK (theme IN ('light', 'dark')),
    require_auth boolean,
    google_sync_enabled boolean,
    sheet_ids jsonb,
    is_configured boolean DEFAULT false,
    configured_at timestamptz,
    address text,
    commercial_phone text,
    social_media jsonb,
    website text,
    cnpj text,
    integrations jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for PIX keys associated with the system configuration
CREATE TABLE public.pix_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    system_config_id uuid NOT NULL REFERENCES public.system_config(id) ON DELETE CASCADE,
    type text CHECK (type IN ('cnpj', 'email', 'phone', 'random')),
    key text NOT NULL,
    description text,
    bank_name text,
    beneficiary_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.pix_keys
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

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

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- Table for user subscriptions
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text,
    plan text,
    interval text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean,
    stripe_subscription_id text,
    stripe_customer_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for products and services
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text CHECK (type IN ('Product', 'Service')),
    price numeric,
    quantity integer,
    category text,
    description text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for clients
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    document text,
    address text,
    tags jsonb,
    notes text,
    is_whatsapp boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for persons (for non-profit organizations)
CREATE TABLE public.persons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    document text,
    address text,
    social_programs jsonb,
    family_income numeric,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.persons
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for sales records
CREATE TABLE public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_date timestamptz NOT NULL,
    value numeric NOT NULL,
    client_id uuid REFERENCES public.clients(id),
    person_id uuid REFERENCES public.persons(id),
    user_id uuid REFERENCES auth.users(id),
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for items included in a sale
CREATE TABLE public.sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    quantity integer,
    price_at_sale numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for financial transactions (expenses)
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text CHECK (category IN ('services', 'consume', 'others')),
    value numeric,
    date timestamptz,
    client_id uuid REFERENCES public.clients(id),
    person_id uuid REFERENCES public.persons(id),
    related_transaction_id uuid REFERENCES public.transactions(id),
    interest_amount numeric,
    is_recurring boolean,
    description text,
    status text CHECK (status IN ('pending', 'paid', 'cancelled')),
    due_date timestamptz,
    notification_dismissed boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- Table for donors (for non-profit organizations)
CREATE TABLE public.donors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    document text,
    type text CHECK (type IN ('individual', 'company', 'organization')),
    address text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.donors
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for income records (for non-profit organizations)
CREATE TABLE public.income (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    description text,
    amount numeric,
    date timestamptz,
    donor_id uuid REFERENCES public.donors(id),
    category text,
    type text CHECK (type IN ('donation', 'grant', 'other')),
    is_recurring boolean,
    recurrence_period text CHECK (recurrence_period IN ('monthly', 'quarterly', 'yearly')),
    notes text,
    status text CHECK (status IN ('pending', 'completed', 'cancelled')),
    payment_method text,
    document_number text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.income
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for invitation codes
CREATE TABLE public.invitation_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    user_gerente_id uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- Note: 'insights' and 'cached_subscription_status' are handled on the client-side (Dexie) and are not represented here.
-- They are derived or cached data.