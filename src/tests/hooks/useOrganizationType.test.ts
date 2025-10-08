import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useOrganizationType } from '../../hooks/useOrganizationType';
import { useAuth } from '../../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext');

// Mock supabaseService to prevent env variable errors
vi.mock('../../services/supabaseService', () => ({
  supabaseService: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('useOrganizationType', () => {
  it('should return isProfit as true for "profit" organization type', () => {
    (useAuth as jest.Mock).mockReturnValue({ organizationType: 'profit' });

    const { result } = renderHook(() => useOrganizationType());

    expect(result.current.isProfit).toBe(true);
    expect(result.current.isNonprofit).toBe(false);
    expect(result.current.organizationType).toBe('profit');
  });

  it('should return isNonprofit as true for "nonprofit" organization type', () => {
    (useAuth as jest.Mock).mockReturnValue({ organizationType: 'nonprofit' });

    const { result } = renderHook(() => useOrganizationType());

    expect(result.current.isProfit).toBe(false);
    expect(result.current.isNonprofit).toBe(true);
    expect(result.current.organizationType).toBe('nonprofit');
  });

  it('should return both as false if organizationType is not set', () => {
    (useAuth as jest.Mock).mockReturnValue({ organizationType: null });

    const { result } = renderHook(() => useOrganizationType());

    expect(result.current.isProfit).toBe(false);
    expect(result.current.isNonprofit).toBe(false);
    expect(result.current.organizationType).toBe(null);
  });
});