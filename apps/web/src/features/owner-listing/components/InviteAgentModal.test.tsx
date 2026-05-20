import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InviteAgentModal } from './InviteAgentModal';

vi.mock('@/api/agents', () => ({
  useAgentSearch: (query: string) => ({
    data: query.length >= 2
      ? [
          { id: 'agent-1', full_name: 'Ravi Patel', agency_name: 'Prime Realty', suburb: 'Navrangpura', avatar_url: null },
          { id: 'agent-2', full_name: 'Sonal Shah', agency_name: 'Urban Homes', suburb: 'Satellite', avatar_url: null },
        ]
      : [],
    isFetching: false,
  }),
}));

vi.mock('@/api/owner-listings', () => ({
  useCreateInvitation: () => ({
    mutate: vi.fn((_params, { onSuccess }: { onSuccess: () => void }) => onSuccess()),
    isPending: false,
  }),
}));

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe('InviteAgentModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    listingId: 'listing-123',
    listingAddress: '12 Main St, Ahmedabad',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(<InviteAgentModal {...defaultProps} />, { wrapper });
    expect(screen.getByText('Invite an Agent')).toBeInTheDocument();
    expect(screen.getByText('12 Main St, Ahmedabad')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type agent name…')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<InviteAgentModal {...defaultProps} isOpen={false} />, { wrapper });
    expect(screen.queryByText('Invite an Agent')).not.toBeInTheDocument();
  });

  it('shows search results when typing 2+ characters', async () => {
    const user = userEvent.setup();
    render(<InviteAgentModal {...defaultProps} />, { wrapper });

    const input = screen.getByPlaceholderText('Type agent name…');
    await user.type(input, 'Ra');

    await waitFor(() => {
      expect(screen.getByText('Ravi Patel')).toBeInTheDocument();
      expect(screen.getByText('Prime Realty · Navrangpura')).toBeInTheDocument();
    });
  });

  it('selects agent and shows selected card', async () => {
    const user = userEvent.setup();
    render(<InviteAgentModal {...defaultProps} />, { wrapper });

    await user.type(screen.getByPlaceholderText('Type agent name…'), 'Ra');
    await waitFor(() => screen.getByText('Ravi Patel'));
    await user.click(screen.getByText('Ravi Patel'));

    expect(screen.getByText('Selected agent')).toBeInTheDocument();
    expect(screen.getByText('Ravi Patel')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Type agent name…')).not.toBeInTheDocument();
  });

  it('removes selected agent when Remove is clicked', async () => {
    const user = userEvent.setup();
    render(<InviteAgentModal {...defaultProps} />, { wrapper });

    await user.type(screen.getByPlaceholderText('Type agent name…'), 'Ra');
    await waitFor(() => screen.getByText('Ravi Patel'));
    await user.click(screen.getByText('Ravi Patel'));
    await user.click(screen.getByText('Remove'));

    expect(screen.getByPlaceholderText('Type agent name…')).toBeInTheDocument();
    expect(screen.queryByText('Selected agent')).not.toBeInTheDocument();
  });

  it('Send Invitation button is disabled without agent selection', () => {
    render(<InviteAgentModal {...defaultProps} />, { wrapper });
    expect(screen.getByText('Send Invitation').closest('button')).toBeDisabled();
  });

  it('calls onClose after successful submission', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InviteAgentModal {...defaultProps} onClose={onClose} />, { wrapper });

    await user.type(screen.getByPlaceholderText('Type agent name…'), 'Ra');
    await waitFor(() => screen.getByText('Ravi Patel'));
    await user.click(screen.getByText('Ravi Patel'));
    await user.click(screen.getByText('Send Invitation'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<InviteAgentModal {...defaultProps} onClose={onClose} />, { wrapper });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
