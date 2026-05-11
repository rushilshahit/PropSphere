import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calcMonthlyRepayment } from '@propsphere/utils';
import { formatPrice } from '@propsphere/utils';

const MIN_LOAN = 1_000_000;   // ₹10L
const MAX_LOAN = 30_000_000;  // ₹3Cr
const RATE = 8.5;
const TERM_YEARS = 20;

export function FinanceCTA() {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState(5_000_000); // ₹50L default
  const monthly = calcMonthlyRepayment(loanAmount, RATE, TERM_YEARS);

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-primary to-[#1239A0] rounded-[20px] p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          {/* Left */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Work out what you can borrow
            </h2>
            <p className="text-white/80 mb-6">
              Use our free calculators to estimate your borrowing capacity, monthly repayments,
              and stamp duty.
            </p>
            <button
              type="button"
              onClick={() => navigate('/finance')}
              className="inline-flex items-center gap-2 border border-white text-white px-5 py-2.5 rounded-btn text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Try the calculators →
            </button>
          </div>

          {/* Right — mini calculator */}
          <div className="bg-white/10 rounded-2xl p-6">
            <p className="text-white/70 text-sm mb-1">Loan amount</p>
            <p className="text-white text-xl font-bold mb-3">{formatPrice(loanAmount)}</p>
            <input
              type="range"
              min={MIN_LOAN}
              max={MAX_LOAN}
              step={100_000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-white mb-4"
            />
            <div className="flex justify-between text-white/50 text-xs mb-4">
              <span>₹10L</span>
              <span>₹3Cr</span>
            </div>
            <p className="text-white/70 text-sm mb-1">Est. monthly repayment</p>
            <p className="text-white text-3xl font-bold tabular-nums">
              {formatPrice(Math.round(monthly))}
            </p>
            <p className="text-white/50 text-xs mt-1">at {RATE}% p.a. over {TERM_YEARS} years</p>
            <button
              type="button"
              onClick={() => navigate('/finance')}
              className="mt-4 text-white/70 text-sm hover:text-white transition-colors"
            >
              See full breakdown →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
