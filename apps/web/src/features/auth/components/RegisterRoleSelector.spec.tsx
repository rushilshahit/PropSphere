import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterRoleSelector } from './RegisterRoleSelector';

describe('RegisterRoleSelector', () => {
  it('renders all three role cards', () => {
    render(<RegisterRoleSelector value="buyer" onChange={() => undefined} />);
    expect(screen.getByText('Buyer / Renter')).toBeInTheDocument();
    expect(screen.getByText('Seller / Owner')).toBeInTheDocument();
    expect(screen.getByText('Agent / Professional')).toBeInTheDocument();
  });

  it('marks the current value as checked', () => {
    render(<RegisterRoleSelector value="seller" onChange={() => undefined} />);
    const sellerCard = screen.getByRole('radio', { name: /seller/i });
    expect(sellerCard).toHaveAttribute('aria-checked', 'true');

    const buyerCard = screen.getByRole('radio', { name: /buyer/i });
    expect(buyerCard).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the selected role when a card is clicked', async () => {
    const handleChange = vi.fn();
    render(<RegisterRoleSelector value="buyer" onChange={handleChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /seller/i }));
    expect(handleChange).toHaveBeenCalledWith('seller');

    await userEvent.click(screen.getByRole('radio', { name: /agent/i }));
    expect(handleChange).toHaveBeenCalledWith('agent');
  });

  it('calls onChange with buyer when the buyer card is clicked', async () => {
    const handleChange = vi.fn();
    render(<RegisterRoleSelector value="seller" onChange={handleChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /buyer/i }));
    expect(handleChange).toHaveBeenCalledWith('buyer');
  });
});
