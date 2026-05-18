import { useState } from 'react';
import { Building2, ExternalLink, Mail, Phone } from 'lucide-react';
import type { AgencyProfile } from '@/api/agencies';
import { Button } from '@/components/ui';
import { EnquiryModal } from '@/features/listing/components/EnquiryModal';

interface AgencyHeroProps {
  agency: AgencyProfile;
}

export function AgencyHero({ agency }: AgencyHeroProps) {
  const [enquireOpen, setEnquireOpen] = useState(false);

  const addressLine = [agency.address, agency.suburb, agency.state]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <div className="bg-neutral-800 rounded-card shadow-card overflow-hidden">
        <div className="px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          {/* Logo */}
          <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-contain p-2" />
            ) : (
              <Building2 className="w-10 h-10 text-neutral-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{agency.name}</h1>

            <div className="mt-2 space-y-1">
              {addressLine && (
                <p className="text-sm text-white/70">{addressLine}</p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {agency.phone && (
                  <a
                    href={`tel:${agency.phone}`}
                    className="text-sm text-white/70 hover:text-white flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {agency.phone}
                  </a>
                )}
                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="md"
            className="shrink-0"
            onClick={() => setEnquireOpen(true)}
          >
            <Mail className="w-4 h-4" />
            Contact agency
          </Button>
        </div>
      </div>

      <EnquiryModal
        agentId={agency.id}
        agentName={agency.name}
        isOpen={enquireOpen}
        onClose={() => setEnquireOpen(false)}
      />
    </>
  );
}
