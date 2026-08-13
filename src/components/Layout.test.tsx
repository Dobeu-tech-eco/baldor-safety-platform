import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    profile: { email: 'admin@baldor.com', is_admin: true },
    signOut: signOutMock,
  }),
}));

function renderLayout(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
          <Route path="/charts" element={<div>Charts page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    signOutMock.mockResolvedValue(undefined);
  });

  it('exposes a skip link to main content', () => {
    renderLayout();
    const skip = screen.getByRole('link', { name: /skip to content/i });
    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(document.getElementById('main-content')).toBeTruthy();
  });

  it('renders primary navigation with the active page marked', () => {
    renderLayout('/dashboard');
    const navs = screen.getAllByRole('navigation', { name: 'Primary' });
    expect(navs.length).toBeGreaterThan(0);
    const current = screen.getAllByRole('link', { name: 'Dashboard' }).find(
      (el) => el.getAttribute('aria-current') === 'page',
    );
    expect(current).toBeTruthy();
  });

  it('opens the mobile drawer and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(screen.queryByRole('dialog', { name: /navigation menu/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(screen.getByRole('dialog', { name: /navigation menu/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /open navigation menu/i }).getAttribute('aria-expanded')).toBe('true');

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /navigation menu/i })).toBeNull();
    });
  });

  it('signs out and navigates to login', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getAllByRole('button', { name: /sign out/i })[0]);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });
    expect(screen.getByText('Login page')).toBeTruthy();
  });
});
