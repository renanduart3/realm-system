import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi } from 'vitest';
import SubscriptionStatus from '../pages/SubscriptionStatus';
import { useAuth } from '../contexts/AuthContext';
import { stripeService } from '../services/payment/StripeService';
import { useToast } from '../hooks/useToast';
import { appConfig } from '../config/app.config';

// Mock dependencies
vi.mock('../contexts/AuthContext');
vi.mock('../services/payment/StripeService');
vi.mock('../hooks/useToast');
vi.mock('../services/supabaseService', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

const mockShowToast = vi.fn();

describe('SubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
  });

  it('shows active subscription for premium users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isPremium: true,
      planName: 'premium',
      subscriptionStatus: 'active',
      user: { email: 'test@example.com' },
    });

    render(
      <Router>
        <SubscriptionStatus />
      </Router>
    );

    expect(screen.getByText('Assinatura Premium Ativa')).toBeInTheDocument();
  });

  it('shows subscription plans for non-premium users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isPremium: false,
      user: { email: 'test@example.com' },
    });

    render(
      <Router>
        <SubscriptionStatus />
      </Router>
    );

    expect(screen.getByText('Escolha seu Plano Premium')).toBeInTheDocument();
    expect(screen.getByText('Premium Mensal')).toBeInTheDocument();
    expect(screen.getByText('Premium Anual')).toBeInTheDocument();
  });

  it('calls stripeService with monthly plan when "Assinar Mensal" is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isPremium: false,
      user: { email: 'test@example.com' },
    });
    (stripeService.createSubscription as jest.Mock).mockResolvedValue({ url: 'https://stripe.com/session' });

    render(
      <Router>
        <SubscriptionStatus />
      </Router>
    );

    fireEvent.click(screen.getByText('Assinar Mensal'));

    await vi.waitFor(() => {
      expect(stripeService.createSubscription).toHaveBeenCalledWith({
        planId: 'premium',
        interval: 'month',
        email: 'test@example.com',
        paymentMethod: 'card',
      });
    });
  });

  it('calls stripeService with yearly plan when "Assinar Anual" is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isPremium: false,
      user: { email: 'test@example.com' },
    });
    (stripeService.createSubscription as jest.Mock).mockResolvedValue({ url: 'https://stripe.com/session' });

    render(
      <Router>
        <SubscriptionStatus />
      </Router>
    );

    fireEvent.click(screen.getByText('Assinar Anual'));

    await vi.waitFor(() => {
      expect(stripeService.createSubscription).toHaveBeenCalledWith({
        planId: 'premium',
        interval: 'year',
        email: 'test@example.com',
        paymentMethod: 'card',
      });
    });
  });
});