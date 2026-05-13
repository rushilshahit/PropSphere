import { useState } from 'react';
import {
  calcBorrowCapacity,
  calcMonthlyRepayment,
  calcStampDuty,
  formatPrice,
} from '@propsphere/utils';

type Tab = 'repayment' | 'borrow' | 'stamp';

const STATE_OPTIONS = [
  { value: 'GJ', label: 'Gujarat' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'DL', label: 'Delhi' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'RJ', label: 'Rajasthan' },
];

const TABS: { id: Tab; label: string }[] = [
  { id: 'repayment', label: 'Monthly Repayment' },
  { id: 'borrow', label: 'Borrowing Capacity' },
  { id: 'stamp', label: 'Stamp Duty' },
];

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-neutral-700">{label}</label>
        <span className="text-sm font-semibold text-neutral-900">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-primary"
      />
      <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
        <span>{min.toLocaleString('en-IN')}</span>
        <span>{max.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-3 border-b border-neutral-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${highlight ? 'text-neutral-900' : 'text-neutral-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${highlight ? 'text-brand-primary text-base' : 'text-neutral-900'}`}>{value}</span>
    </div>
  );
}

function RepaymentCalculator() {
  const [loanAmount, setLoanAmount] = useState(5_000_000);
  const [rate, setRate] = useState(8.5);
  const [term, setTerm] = useState(20);

  const monthly = calcMonthlyRepayment(loanAmount, rate, term);
  const totalPaid = monthly * term * 12;
  const totalInterest = totalPaid - loanAmount;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Loan Amount"
          value={loanAmount}
          min={500_000}
          max={50_000_000}
          step={100_000}
          onChange={setLoanAmount}
          display={formatPrice(loanAmount)}
        />
        <SliderInput
          label="Interest Rate (% p.a.)"
          value={rate}
          min={6}
          max={15}
          step={0.1}
          onChange={setRate}
          display={`${rate.toFixed(1)}%`}
        />
        <SliderInput
          label="Loan Term (years)"
          value={term}
          min={5}
          max={30}
          step={1}
          onChange={setTerm}
          display={`${term} yrs`}
        />
      </div>

      <div className="bg-neutral-50 rounded-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Results</p>
        <ResultRow label="Monthly EMI" value={formatPrice(Math.round(monthly))} highlight />
        <ResultRow label="Principal" value={formatPrice(loanAmount)} />
        <ResultRow label="Total Interest" value={formatPrice(Math.round(totalInterest))} />
        <ResultRow label="Total Payable" value={formatPrice(Math.round(totalPaid))} />
        <p className="text-xs text-neutral-400 mt-4">
          Estimates are indicative. Actual rates may vary by lender.
        </p>
      </div>
    </div>
  );
}

function BorrowingCapacityCalculator() {
  const [income, setIncome] = useState(100_000);
  const [expenses, setExpenses] = useState(20_000);
  const [rate, setRate] = useState(8.5);
  const [term, setTerm] = useState(20);

  const capacity = calcBorrowCapacity(income, expenses, rate, term);
  const maxEmi = Math.max(0, (income - expenses) * 0.4);
  const totalPayable = maxEmi * term * 12;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Monthly Income"
          value={income}
          min={20_000}
          max={1_000_000}
          step={5_000}
          onChange={setIncome}
          display={formatPrice(income)}
        />
        <SliderInput
          label="Existing Monthly Obligations"
          value={expenses}
          min={0}
          max={500_000}
          step={5_000}
          onChange={setExpenses}
          display={formatPrice(expenses)}
        />
        <SliderInput
          label="Interest Rate (% p.a.)"
          value={rate}
          min={6}
          max={15}
          step={0.1}
          onChange={setRate}
          display={`${rate.toFixed(1)}%`}
        />
        <SliderInput
          label="Loan Term (years)"
          value={term}
          min={5}
          max={30}
          step={1}
          onChange={setTerm}
          display={`${term} yrs`}
        />
      </div>

      <div className="bg-neutral-50 rounded-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Results</p>
        <ResultRow label="Max Loan Eligible" value={capacity > 0 ? formatPrice(capacity) : '—'} highlight />
        <ResultRow label="Max Monthly EMI" value={formatPrice(Math.round(maxEmi))} />
        <ResultRow label="Total Payable" value={capacity > 0 ? formatPrice(Math.round(totalPayable)) : '—'} />
        {income <= expenses && (
          <p className="text-xs text-red-500 mt-3">Income must exceed existing obligations.</p>
        )}
        <p className="text-xs text-neutral-400 mt-4">
          Based on 40% FOIR (Fixed Obligation to Income Ratio), standard for Indian home loans.
        </p>
      </div>
    </div>
  );
}

function StampDutyCalculator() {
  const [propertyValue, setPropertyValue] = useState(5_000_000);
  const [state, setState] = useState('GJ');

  const dutyAndReg = calcStampDuty(state, propertyValue);
  const STAMP_DUTY_RATES: Record<string, number> = {
    GJ: 0.049, MH: 0.05, KA: 0.056, DL: 0.06, TN: 0.07, UP: 0.07, RJ: 0.06,
  };
  const stampOnly = Math.round(propertyValue * (STAMP_DUTY_RATES[state] ?? 0.05));
  const regFee = Math.round(propertyValue * 0.01);
  const totalCost = propertyValue + dutyAndReg;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Property Value"
          value={propertyValue}
          min={500_000}
          max={100_000_000}
          step={100_000}
          onChange={setPropertyValue}
          display={formatPrice(propertyValue)}
        />
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            {STATE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Results</p>
        <ResultRow label="Property Value" value={formatPrice(propertyValue)} />
        <ResultRow label="Stamp Duty" value={formatPrice(stampOnly)} />
        <ResultRow label="Registration Fee (1%)" value={formatPrice(regFee)} />
        <ResultRow label="Total Cost" value={formatPrice(totalCost)} highlight />
        <p className="text-xs text-neutral-400 mt-4">
          Rates are approximate. Consult a local registrar for exact figures.
        </p>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>('repayment');

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Finance Calculators</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Estimate your monthly repayments, borrowing capacity, and stamp duty.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl mb-8 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Calculator panels */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8">
        {tab === 'repayment' && <RepaymentCalculator />}
        {tab === 'borrow' && <BorrowingCapacityCalculator />}
        {tab === 'stamp' && <StampDutyCalculator />}
      </div>
    </div>
  );
}
