export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}

export type ExpenseCategory = 'services' | 'consume' | 'others'; // Legacy - manter para compatibilidade
export type SpecificExpenseCategory = 
  // Fixas
  | 'rent' | 'water' | 'electricity' | 'internet' | 'phone' | 'gas'
  // Variáveis  
  | 'salary' | 'supply' | 'maintenance' | 'marketing' | 'others';
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

export interface SaleItem extends BaseEntity {
    sale_id: string;
    product_service_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Expense extends BaseEntity {
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    status: 'pending' | 'paid' | 'cancelled';
    payment_method?: string;
    notes?: string;
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
    recurring_expense_id?: string; // Vincula a um modelo recorrente
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
    isWhatsApp?: boolean;
}

export interface Person extends BaseEntity {
    name: string;
    email: string;
    phone: string;
    isWhatsApp?: boolean;
    birthDate?: string;
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
    person_id?: string;
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
    dayOfMonthDue: number; // 1-31
    category: SpecificExpenseCategory;
    active: boolean;
}

// Despesa virtual gerada a partir de um modelo recorrente
export interface VirtualExpense {
    id: string; // ID do modelo recorrente + mês/ano
    recurringExpenseId: string;
    description: string;
    amount: number;
    category: SpecificExpenseCategory;
    dueDate: string; // Data calculada para o mês/ano
    month: number;
    year: number;
    isPaid: boolean; // Se já foi paga (existe transaction)
    transactionId?: string; // ID da transaction se foi paga
}

// Despesa combinada (real + virtual)
export interface CombinedExpense {
    id: string;
    type: 'real' | 'virtual';
    description: string;
    amount: number;
    category: SpecificExpenseCategory | ExpenseCategory; // Pode ser legacy
    dueDate: string;
    status: 'pending' | 'paid' | 'cancelled';
    isRecurring: boolean;
    recurringExpenseId?: string;
    transactionId?: string;
    interestAmount?: number;
    createdAt?: string;
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
    pix_keys?: {
        id: string;
        type: 'cnpj' | 'email' | 'phone' | 'random';
        key: string;
        description: string;
        bank_name?: string;
        beneficiary_name?: string;
    }[];
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

// Sistema de Assinatura Premium
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'free' | 'premium';
  features: string[];
  limitations: string[];
  price?: number;
  billing?: 'monthly' | 'yearly';
}

export interface PremiumReport {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'sales' | 'products' | 'clients' | 'analytics';
  isAvailable: boolean;
}

export interface SubscriptionState {
  isPremium: boolean;
  plan: SubscriptionPlan | null;
  features: {
    canUseAdvancedReports: boolean;
    canUseCloudBackup: boolean;
    canUseBusinessIntelligence: boolean;
    canUseGoogleSheetsSync: boolean;
    canExportData: boolean;
  };
  isLoading: boolean;
}

// Cache local de planos do Stripe (armazenado no SystemConfig/OrganizationSetup)
export interface CachedPlanInfo {
  name: string;
  priceId: string;
  price: number | null;
  interval: 'month' | 'year';
}

export interface CachedPlans {
  monthly?: CachedPlanInfo | null;
  annual?: CachedPlanInfo | null;
  lastUpdated?: string; // ISO date
  source?: 'supabase' | 'appConfig' | 'unknown';
}
