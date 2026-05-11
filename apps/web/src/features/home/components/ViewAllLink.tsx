import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ViewAllLinkProps {
  to: string;
  label: string;
}

export function ViewAllLink({ to, label }: ViewAllLinkProps) {
  return (
    <div className="mt-6 text-center">
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-brand-primary font-medium hover:underline"
      >
        {label}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
