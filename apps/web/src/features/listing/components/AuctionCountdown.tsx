import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
}

function getTimeLeft(target: string): TimeLeft | null {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    isUrgent: diff < 86_400_000,
  };
}

interface AuctionCountdownProps {
  auctionAt: string;
}

export function AuctionCountdown({ auctionAt }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(auctionAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(auctionAt));
    }, 1_000);
    return () => clearInterval(interval);
  }, [auctionAt]);

  if (!timeLeft) return null;

  const accent = timeLeft.isUrgent ? 'text-red-600' : 'text-brand-primary';
  const bg = timeLeft.isUrgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';

  return (
    <div className={`border rounded-card p-5 ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <Timer className={`w-4 h-4 ${accent}`} />
        <span className={`text-sm font-semibold ${accent}`}>Auction countdown</span>
      </div>
      <div className="flex gap-4">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Mins' },
          { value: timeLeft.seconds, label: 'Secs' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center min-w-[48px]">
            <span className={`text-3xl font-bold tabular-nums ${accent}`}>
              {value.toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-neutral-500 mt-0.5">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
