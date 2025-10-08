import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PaymentSuccess from '../pages/payment/PaymentSuccess';
import PaymentCancel from '../pages/payment/PaymentCancel';
import { stripeService } from '../services/payment/StripeService';

// Mock dependencies
vi.mock('../services/payment/StripeService', () => ({
  stripeService: {
    handlePaymentSuccess: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    refreshSubscription: vi.fn().mockResolvedValue(true),
  }),
}));

describe('Payment Status Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, href: '', search: '' },
    });
  });

  describe('PaymentSuccess', () => {
    it('shows success message and calls stripe service', async () => {
      window.location.search = '?session_id=test_session_id';
      (stripeService.handlePaymentSuccess as jest.Mock).mockResolvedValue(true);

      render(<PaymentSuccess />);

      expect(await screen.findByText(/Payment Successful!/)).toBeInTheDocument();
      expect(stripeService.handlePaymentSuccess).toHaveBeenCalledWith('test_session_id');
    });

    it('shows error when stripe service fails', async () => {
      window.location.search = '?session_id=test_session_id';
      (stripeService.handlePaymentSuccess as jest.Mock).mockRejectedValue(new Error('Verification failed'));

      render(<PaymentSuccess />);

      expect(await screen.findByText(/There was an issue verifying your payment./)).toBeInTheDocument();
      expect(screen.getByText('Payment Verification Error')).toBeInTheDocument();
    });

    it('shows error when no session ID is provided', async () => {
      window.location.search = '';
      render(<PaymentSuccess />);

      expect(await screen.findByText(/No session ID found/)).toBeInTheDocument();
      expect(screen.getByText('Payment Verification Error')).toBeInTheDocument();
    });
  });

  describe('PaymentCancel', () => {
    it('shows cancellation message', () => {
      render(<PaymentCancel />);
      expect(screen.getByText('Payment Cancelled')).toBeInTheDocument();
      expect(screen.getByText(/You'll be redirected/)).toBeInTheDocument();
    });
  });
});