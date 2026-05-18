import { Mail, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropertyDetail } from '@propsphere/types';
import { Button } from '@/components/ui';

interface AgentCardProps {
  agent: PropertyDetail['agent'];
  agency: PropertyDetail['agency'];
  onEnquire: () => void;
}

export function AgentCard({ agent, agency, onEnquire }: AgentCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-card p-5">
      <div className="flex items-start gap-3 mb-4">
        {/* Agent avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 shrink-0">
          {agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt={agent.full_name ?? 'Agent'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-neutral-400" />
            </div>
          )}
        </div>

        {/* Agent info */}
        <div className="min-w-0">
          {agent.slug ? (
            <Link
              to={`/agent/${agent.slug}`}
              className="text-sm font-semibold text-neutral-900 hover:text-brand-primary truncate block"
            >
              {agent.full_name ?? 'Agent'}
            </Link>
          ) : (
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {agent.full_name ?? 'Agent'}
            </p>
          )}
          {agency.slug ? (
            <Link
              to={`/agency/${agency.slug}`}
              className="text-xs text-brand-secondary hover:text-brand-accent truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {agency.name}
            </Link>
          ) : (
            <p className="text-xs text-neutral-500 truncate">{agency.name}</p>
          )}
        </div>

        {/* Agency logo */}
        {agency.logo_url && (
          <img
            src={agency.logo_url}
            alt={agency.name}
            className="h-8 w-auto ml-auto object-contain"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button variant="primary" size="sm" className="w-full" onClick={onEnquire}>
          <Mail className="w-3.5 h-3.5" />
          Email agent
        </Button>

        {agent.phone && (
          <a href={`tel:${agent.phone}`} className="w-full">
            <Button variant="secondary" size="sm" className="w-full">
              <Phone className="w-3.5 h-3.5" />
              {agent.phone}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
