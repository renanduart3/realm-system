import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../pages/Login';
import { useAuth } from '../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Login', () => {
  it('renders the login page with Google sign-in button', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loginWithGoogle: vi.fn(),
    });

    render(
      <Router>
        <Login />
      </Router>
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
    expect(screen.getByText('Continuar com Google')).toBeInTheDocument();
  });

  it('calls loginWithGoogle when the Google sign-in button is clicked', () => {
    const loginWithGoogleMock = vi.fn();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loginWithGoogle: loginWithGoogleMock,
    });

    render(
      <Router>
        <Login />
      </Router>
    );

    fireEvent.click(screen.getByText('Continuar com Google'));
    expect(loginWithGoogleMock).toHaveBeenCalledTimes(1);
  });

  it('redirects to the dashboard if the user is already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <Router>
        <Login />
      </Router>
    );

    expect(mockedNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});