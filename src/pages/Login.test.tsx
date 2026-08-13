import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';

const { signInMock, navigateMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({ signIn: signInMock }),
}));

vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

describe('Login', () => {
  beforeEach(() => {
    signInMock.mockReset();
    navigateMock.mockReset();
    signInMock.mockResolvedValue({});
  });

  it('does not offer first-time setup or account creation', () => {
    render(<Login />);

    expect(screen.queryByText(/first-time/i)).toBeNull();
    expect(screen.queryByText(/create initial admin/i)).toBeNull();
    expect(screen.queryByText(/create account/i)).toBeNull();
  });

  it('renders a sign-in heading', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeTruthy();
  });

  it('calls signIn with the submitted email and password', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'admin@baldor.com');
    await user.type(screen.getByLabelText(/password/i), 'secret12');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(signInMock).toHaveBeenCalledWith('admin@baldor.com', 'secret12');
  });

  it('shows an alert with the signIn error message', async () => {
    signInMock.mockResolvedValue({ error: 'Invalid login credentials' });
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'admin@baldor.com');
    await user.type(screen.getByLabelText(/password/i), 'secret12');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Invalid login credentials');
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('navigates to /dashboard on successful sign-in', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'admin@baldor.com');
    await user.type(screen.getByLabelText(/password/i), 'secret12');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});
