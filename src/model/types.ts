export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}

export type ExpenseCategory = 'services' | 'consume' | 'others';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface SystemConfig extends BaseEntity {
    organization_type: 'profit' | 'nonprofit';
    organization_name: string;
    currency: string;
    theme: 'light' | 'dark';
    require_auth: boolean;
    google_sync_enabled: boolean;
    sheet_ids?: { [key: number]: string };
    is_configured: boolean;
    configured_at?: string;
    subscription?: {
        plan: 'free' | 'premium';
        billing: 'monthly' | 'yearly';
        payment_status: PaymentStatus;
        last_payment_date?: string;
        next_billing_date?: string;
        stripe_subscription_id?: string;
        stripe_customer_id?: string;
        is_early_user?: boolean;
    };
}

export interface CachedSubscriptionStatus {
  id: string; // Primary key, e.g., 'currentUser'
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'free' | 'none';
  planName: 'free' | 'premium';
  interval?: 'month' | 'year';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  lastSync: string; // Timestamp of the last update/fetch
  userId?: string; // Optional, for potential multi-user scenarios
}

export interface ProductService extends BaseEntity {
    name: string;
    type: 'Product' | 'Service';
    price: number;
    quantity?: number;
    category: string;
    description: string;
    active?: boolean;
}

export interface Sale {
    id: string;
    date: string;
    time: string;
    value: number;
    client_id?: string;
    person_id?: string;
    userId?: string; // Added
    description?: string;
    created_at: string;
    updated_at: string;

}

export interface Transaction extends BaseEntity {
    category: ExpenseCategory;
    value: number;
    date: string;
    time: string;
    client_id?: string;
    person_id?: string;
    related_transaction_id?: string;
    interest_amount?: number;
    is_recurring?: boolean;
    description?: string;
    status: 'pending' | 'paid' | 'cancelled';
    due_date?: string;
    notification_dismissed?: boolean;
}

export interface SystemUser extends BaseEntity {
    username: string;
    email: string;
    password?: string;
    role: 'master' | 'seller';
    nature_type: 'profit' | 'nonprofit';
    subscription?: UserSubscription;
}

export interface UserSubscription {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'none';
    plan: 'free' | 'premium';
    interval: 'month' | 'year';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
}

export interface InvitationCode {
    id: string;
    code: string;
    user_gerente_id: string;
    created_at: string;
}

export interface Client extends BaseEntity {
    name: string;
    email: string;
    phone: string;
    document: string;
    address?: string;
    tags?: string[];
    notes?: string;
}

export interface Person extends BaseEntity {
    name: string;
    email: string;
    phone: string;
    document: string;
    address?: string;
    socialPrograms?: string[];
    familyIncome?: number;
    notes?: string;
}

export interface Donor extends BaseEntity {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    type: 'individual' | 'company' | 'organization';
    address?: string;
    notes?: string;
}

export type TransactionType = 'donation' | 'grant' | 'other';
export type RecurrencePeriod = 'monthly' | 'quarterly' | 'yearly';

export interface Income extends BaseEntity {
    description: string;
    amount: number;
    date: string;
    donor_id?: string;
    category: string;
    type: TransactionType;
    is_recurring: boolean;
    recurrence_period?: RecurrencePeriod;
    notes?: string;
    status: 'pending' | 'completed' | 'cancelled';
    payment_method?: string;
    document_number?: string;
}

export interface RecurringExpense extends BaseEntity {
    description: string;
    amount: number;
    due_date: number;
    category: ExpenseCategory;
    is_recurring: boolean;
}

// Interfaces para Insights
export interface DemandPrediction {
    topProducts: { name: string; predictedDemand: number; trend: "up" | "down"; confidence: number; }[];
    seasonalTrends?: { [key: string]: string[] };
}

export interface CustomerSentiment {
    overallSentiment: number;
    recentTrend: "positive" | "negative" | "neutral";
    topComplaints: string[];
    topPraises: string[];
    recentReviews: string[];
}

export interface ExpenseAnalysis {
    topExpenses: { category: string; amount: number; trend: "up" | "down"; }[];
    savingsOpportunities?: string[];
}

export interface SalesPerformance {
    topProducts: { name: string; revenue: number; growth: number; date: string }[];
    seasonalPerformance?: { [key: string]: { revenue: number; growth: number } };
}

export interface Fidelization {
    topCustomers: { name: string; totalPurchases: number; frequentItems: string[]; suggestedReward: string; }[];
    productPairs?: string[];
}

// Non-profit specific insights
export interface ProgramImpact {
  programs: {
    name: string;
    beneficiariesReached: number;
    outcomeMetric: string;
    // Example: 'Reading Level Improvement: 25%'
  }[];
  overallImpactScore: number; // e.g., 0.0 to 1.0
}

export interface DonorEngagement {
  activeDonors: number;
  donationFrequency: number; // e.g., average donations per donor per year
  averageDonationAmount: number;
  topDonors?: { name: string; totalDonated: number; lastDonationDate: string }[];
  // donationTrends?: { month: string; totalAmount: number }[]; // Optional for more detail
}

export interface InsightData {
    demandPrediction: DemandPrediction | null;
    customerSentiment: CustomerSentiment | null;
    expenseAnalysis: ExpenseAnalysis; // Common for both
    salesPerformance: SalesPerformance | null;
    fidelization: Fidelization | null;
    // Non-profit specific insights
    programImpact?: ProgramImpact | null;
    donorEngagement?: DonorEngagement | null;
}

export interface OrganizationSetup extends SystemConfig {
    address?: string;
    commercial_phone?: string;
    social_media?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        twitter?: string;
    };
    website?: string;
    cnpj?: string;
    pix_key?: {
        type: 'cnpj' | 'email' | 'phone' | 'random';
        key: string;
    };
    integrations?: {
        google_connected?: boolean;
        openai_connected?: boolean;
        supabase_connected?: boolean;
    };
}

export type PaymentProvider = 'stripe' | 'mercadopago' | 'pagar.me';

export interface PaymentConfig {
  provider: PaymentProvider;
  apiKey: string;
  environment: 'development' | 'production';
}

export interface PaymentError {
  code: string;
  message: string;
  timestamp: string;
}
