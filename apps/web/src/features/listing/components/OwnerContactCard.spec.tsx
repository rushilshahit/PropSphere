import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerContactCard } from './OwnerContactCard';

describe('OwnerContactCard', () => {
  it('renders the owner name when provided', () => {
    render(<OwnerContactCard ownerName="Ramesh Patel" onEnquire={() => undefined} />);
    expect(screen.getByText('Ramesh Patel')).toBeInTheDocument();
  });

  it('falls back to "Private seller" when ownerName is null', () => {
    render(<OwnerContactCard ownerName={null} onEnquire={() => undefined} />);
    expect(screen.getByText('Private seller')).toBeInTheDocument();
  });

  it('shows the "Private listing" label', () => {
    render(<OwnerContactCard ownerName={null} onEnquire={() => undefined} />);
    expect(screen.getByText(/private listing/i)).toBeInTheDocument();
  });

  it('does not display a phone number', () => {
    render(<OwnerContactCard ownerName="Ramesh Patel" onEnquire={() => undefined} />);
    expect(screen.queryByText(/call/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tel:/i })).not.toBeInTheDocument();
  });

  it('calls onEnquire when the Email owner button is clicked', async () => {
    const handleEnquire = vi.fn();
    render(<OwnerContactCard ownerName="Ramesh Patel" onEnquire={handleEnquire} />);
    await userEvent.click(screen.getByRole('button', { name: /email owner/i }));
    expect(handleEnquire).toHaveBeenCalledOnce();
  });
});
