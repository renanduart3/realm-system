import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi } from 'vitest';
import SetupWizard from '../pages/SetupWizard';

// Mock the systemConfigService
vi.mock('../services/systemConfigService', () => ({
  systemConfigService: {
    getConfig: vi.fn().mockResolvedValue({
      is_configured: false,
      organization_type: 'profit',
      organization_name: 'Minha Organização',
      currency: 'BRL',
      theme: 'light',
      require_auth: true,
      google_sync_enabled: false,
    }),
    saveConfig: vi.fn().mockResolvedValue(true),
  },
}));

describe('SetupWizard', () => {
  it('renders the setup wizard', () => {
    render(
      <Router>
        <SetupWizard />
      </Router>
    );

    expect(screen.getByText('Configuração Inicial')).toBeInTheDocument();
  });
});