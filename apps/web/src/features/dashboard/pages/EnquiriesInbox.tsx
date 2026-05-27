import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgentEnquiries } from '@/api/agents';
import { useOwnerEnquiries } from '@/api/owner-listings';
import { useAppSelector } from '@/store/hooks';
import { selectIsAgent } from '@/features/auth/store/authSlice';
import { Skeleton } from '@/components/ui';

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-brand-primary/10 text-brand-primary',
  read: 'bg-neutral-100 text-neutral-500',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-neutral-100 text-neutral-400',
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-btn" />
      ))}
    </div>
  );
}

export default function EnquiriesInbox() {
  const [page, setPage] = useState(1);
  const isAgent = useAppSelector(selectIsAgent);
  const agentEnquiries = useAgentEnquiries(page, { enabled: isAgent });
  const ownerEnquiries = useOwnerEnquiries(page);
  const { data, isLoading } = isAgent ? agentEnquiries : ownerEnquiries;

  const enquiries = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Enquiries</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Messages from prospective buyers and renters</p>
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && enquiries.length === 0 && (
        <div className="text-center py-16 text-neutral-400">No enquiries yet.</div>
      )}

      {!isLoading && enquiries.length > 0 && (
        <>
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-500">Property</th>
                  <th className="px-4 py-3 font-medium text-neutral-500">Sender</th>
                  <th className="px-4 py-3 font-medium text-neutral-500">Message</th>
                  <th className="px-4 py-3 font-medium text-neutral-500">Date</th>
                  <th className="px-4 py-3 font-medium text-neutral-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {enq.property ? (
                        <p className="font-medium text-neutral-900 line-clamp-1">
                          {enq.property.headline ?? `${enq.property.suburb}, ${enq.property.state.toUpperCase()}`}
                        </p>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800">{enq.sender_name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{enq.sender_email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-neutral-600 line-clamp-2">{enq.message}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {new Date(enq.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGE[enq.status] ?? 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {enq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-btn border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-btn border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
