import { useEffect, useRef, useState } from 'react';
import { Search, X, UserCheck, Info } from 'lucide-react';
import { useAgentSearch, type AgentSearchResult } from '@/api/agents';
import { useCreateInvitation } from '@/api/owner-listings';
import { Spinner } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface InviteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingAddress: string;
}

function AgentAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'Agent'}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-brand-primary">{initials}</span>
    </div>
  );
}

export function InviteAgentModal({ isOpen, onClose, listingId, listingAddress }: InviteAgentModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentSearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isFetching } = useAgentSearch(debouncedQuery);
  const { mutate: createInvitation, isPending } = useCreateInvitation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
      setSelectedAgent(null);
      setMessage('');
      setShowResults(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        !searchRef.current?.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectAgent(agent: AgentSearchResult) {
    setSelectedAgent(agent);
    setSearchQuery('');
    setDebouncedQuery('');
    setShowResults(false);
  }

  function handleRemoveAgent() {
    setSelectedAgent(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function handleSubmit() {
    if (!selectedAgent) return;
    createInvitation(
      { propertyId: listingId, agentId: selectedAgent.id, message: message.trim() || undefined },
      {
        onSuccess: () => {
          toast('Invitation sent to ' + (selectedAgent.full_name ?? 'agent'), 'success');
          onClose();
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Failed to send invitation';
          toast(msg, 'error');
        },
      },
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-card shadow-modal w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Invite an Agent</h2>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{listingAddress}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Agent search */}
          {!selectedAgent ? (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Search for an agent
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Type agent name…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  autoFocus
                />
                {isFetching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>

              {/* Results dropdown */}
              {showResults && debouncedQuery.length >= 2 && (
                <div
                  ref={resultsRef}
                  className="mt-1 bg-white border border-neutral-200 rounded-btn shadow-card-hover overflow-hidden"
                >
                  {!searchResults?.length && !isFetching ? (
                    <p className="text-sm text-neutral-400 px-3 py-3">No agents found</p>
                  ) : (
                    <ul>
                      {(searchResults ?? []).map((agent) => (
                        <li key={agent.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectAgent(agent)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                          >
                            <AgentAvatar name={agent.full_name} avatarUrl={agent.avatar_url} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">
                                {agent.full_name ?? 'Unknown Agent'}
                              </p>
                              <p className="text-xs text-neutral-400 truncate">
                                {[agent.agency_name, agent.suburb].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected agent card */
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Selected agent
              </label>
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-btn">
                <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <AgentAvatar name={selectedAgent.full_name} avatarUrl={selectedAgent.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {selectedAgent.full_name ?? 'Unknown Agent'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {[selectedAgent.agency_name, selectedAgent.suburb].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAgent}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Optional message */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Message <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'd like to invite you to manage this listing…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
            />
          </div>

          {/* What happens next */}
          <div className="flex gap-2.5 p-3 bg-blue-50 rounded-btn border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-0.5">
              <p className="font-medium">What happens next?</p>
              <p>The agent receives an email with your invitation and has 7 days to accept.</p>
              <p>If accepted, they will become the managing agent for this listing.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedAgent || isPending}
            className="flex items-center gap-1.5 text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-btn hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending && <Spinner size="sm" />}
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}
