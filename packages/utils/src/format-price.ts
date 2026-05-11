/**
 * Formats an INR amount into human-readable lakhs/crores notation.
 * @example formatPrice(4500000) → "₹45 L"
 * @example formatPrice(12000000) → "₹1.2 Cr"
 */
export function formatPrice(amount: number): string {
  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    return `₹${parseFloat(cr.toFixed(2))} Cr`;
  }
  if (amount >= 100_000) {
    const l = amount / 100_000;
    return `₹${parseFloat(l.toFixed(1))} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}
