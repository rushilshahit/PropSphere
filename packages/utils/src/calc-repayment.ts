/**
 * Calculates the monthly loan repayment using the standard amortisation formula.
 * @param principal - Loan amount in INR
 * @param annualRate - Annual interest rate as a percentage (e.g. 8.5 for 8.5%)
 * @param termYears - Loan term in years
 */
export function calcMonthlyRepayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}
