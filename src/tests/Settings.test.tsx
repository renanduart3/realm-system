import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi } from 'vitest';
import Settings from '../pages/Settings';
import { useAuth } from '../contexts/AuthContext';
import { systemConfigService } from '../services/systemConfigService';
import { useToast } from '../hooks/useToast';
import useSubscriptionFeatures from '../hooks/useSubscriptionFeatures';

// Mock dependencies
vi.mock('../contexts/AuthContext');
vi.mock('../services/systemConfigService');
vi.mock('../services/googleSheets.service');
vi.mock('../hooks/useToast');
vi.mock('../hooks/useSubscriptionFeatures');
vi.mock('../services/payment/StripeService');
vi.mock('../services/supabaseService', () => ({
  supabaseService: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'fake-token' } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isPremium: false,
      user: { email: 'test@example.com' },
    });
    (useSubscriptionFeatures as jest.Mock).mockReturnValue({
        canUseCloudBackup: false,
        isLoading: false,
    });
  });

  it('displays the correct organization type and it is not editable', async () => {
    (systemConfigService.getConfig as jest.Mock).mockResolvedValue({
      organization_type: 'profit',
      organization_name: 'Test Corp',
    });

    render(
      <Router>
        <Settings />
      </Router>
    );

    await screen.findByText('Configurações da Organização');

    expect(screen.getByText('Com fins lucrativos')).toBeInTheDocument();
    expect(screen.getByText('Para alterar, use a opção "Resetar Sistema"')).toBeInTheDocument();
  });

  it('displays "Sem fins lucrativos" for non-profit organizations', async () => {
    (systemConfigService.getConfig as jest.Mock).mockResolvedValue({
      organization_type: 'nonprofit',
      organization_name: 'Test NGO',
    });

    render(
      <Router>
        <Settings />
      </Router>
    );

    await screen.findByText('Configurações da Organização');

    expect(screen.getByText('Sem fins lucrativos')).toBeInTheDocument();
  });

  it('allows editing and saving of other organization settings', async () => {
    const saveConfigMock = (systemConfigService.saveConfig as jest.Mock).mockResolvedValue(true);
    (systemConfigService.getConfig as jest.Mock).mockResolvedValue({
      organization_type: 'profit',
      organization_name: 'Initial Name',
    });

    render(
      <Router>
        <Settings />
      </Router>
    );

    await screen.findByText('Configurações da Organização');

    // Enter edit mode
    fireEvent.click(screen.getByText('Editar'));

    // Change the organization name
    const nameInput = screen.getByLabelText('Nome da Organização *');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    // Save the changes
    fireEvent.click(screen.getByText('Salvar'));

    await vi.waitFor(() => {
      expect(saveConfigMock).toHaveBeenCalledWith(expect.objectContaining({
        organization_name: 'New Name',
      }));
    });
  });
});