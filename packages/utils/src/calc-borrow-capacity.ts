/**
 * Estimates maximum home loan principal based on income, expenses, rate, and term.
 * Uses 40% FOIR (Fixed Obligation to Income Ratio) — standard for Indian home loans.
 * @param monthlyIncome - Gross monthly income in INR
 * @param monthlyExpenses - Existing fixed monthly obligations in INR
 * @param annualRate - Annual interest rate as a percentage (e.g. 8.5 for 8.5%)
 * @param termYears - Loan term in years
 */
export function calcBorrowCapacity(
  monthlyIncome: number,
  monthlyExpenses: number,
  annualRate: number,
  termYears: number,
): number {
  const maxEmi = (monthlyIncome - monthlyExpenses) * 0.4;
  if (maxEmi <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return Math.round(maxEmi * n);
  return Math.round((maxEmi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)));
}
