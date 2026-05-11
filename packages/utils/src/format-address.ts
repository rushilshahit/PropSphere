/**
 * Formats a property address from its constituent parts.
 * @example formatAddress('4A', '22', 'Park Street', 'Navrangpura', 'GJ') → "4A/22 Park Street, Navrangpura GJ"
 */
export function formatAddress(
  unit_number: string | null | undefined,
  street_number: string,
  street_name: string,
  suburb: string,
  state: string,
): string {
  const street = unit_number
    ? `${unit_number}/${street_number} ${street_name}`
    : `${street_number} ${street_name}`;
  return `${street}, ${suburb} ${state}`;
}
