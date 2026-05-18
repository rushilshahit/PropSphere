import { MessageSquare, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMyEnquiries } from '@/api/account';
import { Spinner } from '@/components/ui';

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
};

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  read: 'bg-neutral-100 text-neutral-600',
  replied: 'bg-green-50 text-green-700',
  archived: 'bg-neutral-100 text-neutral-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EnquiryHistoryPage() {
  const { data: enquiries, isLoading } = useMyEnquiries();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-neutral-400" />
        <h1 className="text-xl font-bold text-neutral-900">My Enquiries</h1>
        {enquiries && enquiries.length > 0 && (
          <span className="text-sm text-neutral-400">({enquiries.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !enquiries || enquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MessageSquare className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-sm">
            No enquiries yet.
            <br />
            Enquiries you send on properties will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {enquiries.map((enq) => (
            <li key={enq.id} className="py-4 flex gap-4">
              {/* Property thumbnail */}
              <div className="flex-shrink-0 w-16 h-16 rounded-btn overflow-hidden bg-neutral-100">
                {enq.property?.heroImageUrl ? (
                  <img
                    src={enq.property.heroImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-neutral-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {enq.property ? (
                      <Link
                        to={`/buy/${enq.property.id}`}
                        className="text-sm font-medium text-neutral-900 hover:text-brand-primary transition-colors truncate block"
                      >
                        {enq.property.headline ??
                          `${enq.property.suburb}, ${enq.property.state}`}
                        <ExternalLink className="inline-block w-3 h-3 ml-1 text-neutral-400" />
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-neutral-400">
                        Property no longer available
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(enq.createdAt)}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-badge ${STATUS_COLOR[enq.status] ?? STATUS_COLOR['read']}`}
                  >
                    {STATUS_LABEL[enq.status] ?? enq.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1.5 line-clamp-2">{enq.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
