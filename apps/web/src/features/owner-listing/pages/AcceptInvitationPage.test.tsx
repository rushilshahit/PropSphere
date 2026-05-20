import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AcceptInvitationPage from './AcceptInvitationPage';
import * as OwnerListingsApi from '@/api/owner-listings';

vi.mock('@/api/owner-listings', () => ({
  useInvitationPreview: vi.fn(),
  useAcceptInvitation: () => ({
    mutate: vi.fn((_token: string, { onSuccess }: { onSuccess: () => void }) => onSuccess()),
    isPending: false,
  }),
  useDeclineInvitation: () => ({
    mutate: vi.fn((_token: string, { onSuccess }: { onSuccess: () => void }) => onSuccess()),
    isPending: false,
  }),
}));

const mockPreview = {
  id: 'inv-1',
  message: 'Please take over this listing.',
  status: 'pending',
  expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  property: {
    id: 'prop-1',
    headline: 'Modern 3BHK in Navrangpura',
    address: '12 Main St, Ahmedabad GJ',
    suburb: 'Navrangpura',
    state: 'GJ',
    listing_type: 'buy',
  },
  owner_name: 'Arjun Mehta',
};

function renderPage(token = 'valid-token') {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/accept-invitation/${token}`]}>
        <Routes>
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
          <Route path="/dashboard/listings" element={<div>Dashboard</div>} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching', () => {
    vi.mocked(OwnerListingsApi.useInvitationPreview).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof OwnerListingsApi.useInvitationPreview>);

    renderPage();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders invitation details for a valid pending invitation', async () => {
    vi.mocked(OwnerListingsApi.useInvitationPreview).mockReturnValue({
      data: mockPreview,
      isLoading: false,
      error: null,
    } as ReturnType<typeof OwnerListingsApi.useInvitationPreview>);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Arjun Mehta has invited you')).toBeInTheDocument();
      expect(screen.getByText('Modern 3BHK in Navrangpura')).toBeInTheDocument();
      expect(screen.getByText('Please take over this listing.')).toBeInTheDocument();
      expect(screen.getByText(/Accept & become managing agent/)).toBeInTheDocument();
    });
  });

  it('shows accepted state after clicking Accept', async () => {
    const user = userEvent.setup();
    vi.mocked(OwnerListingsApi.useInvitationPreview).mockReturnValue({
      data: mockPreview,
      isLoading: false,
      error: null,
    } as ReturnType<typeof OwnerListingsApi.useInvitationPreview>);

    renderPage();

    await user.click(screen.getByText(/Accept & become managing agent/));
    await waitFor(() => {
      expect(screen.getByText('Invitation accepted')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  it('shows confirm UI then declined state when Decline is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(OwnerListingsApi.useInvitationPreview).mockReturnValue({
      data: mockPreview,
      isLoading: false,
      error: null,
    } as ReturnType<typeof OwnerListingsApi.useInvitationPreview>);

    renderPage();

    await user.click(screen.getByText('Decline'));
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();

    await user.click(screen.getByText('Yes, decline'));
    await waitFor(() => {
      expect(screen.getByText('Invitation declined')).toBeInTheDocument();
    });
  });

  it('shows expired state when error message is invitation_expired', () => {
    vi.mocked(OwnerListingsApi.useInvitationPreview).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('invitation_expired'),
    } as ReturnType<typeof OwnerListingsApi.useInvitationPreview>);

    renderPage();
    expect(screen.getByText('Invitation expired')).toBeInTheDocument();
  });

  it('shows 404 state for an invalid token', () => {
    vi.mocked(OwnerListingsApi.useInvitationPreview).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Invalid invitation'),
    } as ReturnType<typeof OwnerListingsApi.useInvitationPreview>);

    renderPage('bad-token');
    expect(screen.getByText('Invitation not found')).toBeInTheDocument();
  });
});
