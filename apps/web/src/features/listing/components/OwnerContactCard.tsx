import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui';

interface OwnerContactCardProps {
  ownerName: string | null;
  onEnquire: () => void;
}

export function OwnerContactCard({ ownerName, onEnquire }: OwnerContactCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-card p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Lock className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          Private listing
        </span>
      </div>
      <p className="text-sm font-semibold text-neutral-900 mb-4">
        {ownerName ?? 'Private seller'}
      </p>
      <Button variant="primary" size="sm" className="w-full" onClick={onEnquire}>
        <Mail className="w-3.5 h-3.5" />
        Email owner
      </Button>
    </div>
  );
}
