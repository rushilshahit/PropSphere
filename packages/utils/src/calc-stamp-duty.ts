// Simplified stamp duty rates for major Indian states (stamp duty + registration fee)
const STAMP_DUTY_RATES: Record<string, number> = {
  GJ: 0.049, // Gujarat: 4.9%
  MH: 0.05,  // Maharashtra: 5%
  KA: 0.056, // Karnataka: 5.6%
  DL: 0.06,  // Delhi: 6%
  TN: 0.07,  // Tamil Nadu: 7%
  UP: 0.07,  // Uttar Pradesh: 7%
  RJ: 0.06,  // Rajasthan: 6%
};

const REGISTRATION_FEE_RATE = 0.01;

/**
 * Calculates the total stamp duty + registration fee for a property purchase.
 * @param state - Two-letter Indian state code (e.g. 'GJ' for Gujarat)
 * @param value - Property value in INR
 * @returns Total stamp duty + registration fee in INR
 */
export function calcStampDuty(state: string, value: number): number {
  const rate = STAMP_DUTY_RATES[state.toUpperCase()] ?? 0.05;
  return Math.round(value * (rate + REGISTRATION_FEE_RATE));
}
