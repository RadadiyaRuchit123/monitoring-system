import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../Header';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'owner@iscon.com' },
    profile: { name: 'Admin Owner', role: 'owner' },
    logout: vi.fn(),
    isOwner: true,
    isOfficeStaff: false,
    isCashier: false,
    isKarigar: false,
    userBranch: 'Iscon Branch',
  }),
}));

describe('Header Component', () => {
  it('renders brand name and owner role badge correctly', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Iscon Gathiya')).toBeInTheDocument();
    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText(/Iscon Branch/i)).toBeInTheDocument();
  });

  it('opens dropdown menu when user profile button is clicked', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const userButton = screen.getByText('Admin Owner');
    expect(userButton).toBeInTheDocument();

    fireEvent.click(userButton);

    expect(screen.getByText('My Checklist')).toBeInTheDocument();
    expect(screen.getByText('Control Center')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});
