import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAgents, type AgentSummary } from '@/api/agents';

function AgentCard({ agent }: { agent: AgentSummary }) {
  const initials = agent.full_name
    ? agent.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex gap-4 hover:shadow-md transition-shadow">
      <div className="w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-lg flex items-center justify-center shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-neutral-900 truncate">
          {agent.full_name ?? 'Agent'}
        </p>
        <p className="text-sm text-neutral-500 truncate">{agent.agency_name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {agent.agency_suburb}, {agent.agency_state}
        </p>
        {agent.bio && (
          <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{agent.bio}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
          {agent.active_listings > 0 && (
            <span className="bg-neutral-100 px-2 py-0.5 rounded-full">
              {agent.active_listings} active listing{agent.active_listings !== 1 ? 's' : ''}
            </span>
          )}
          {agent.years_active && (
            <span>{agent.years_active} yr{agent.years_active !== 1 ? 's' : ''} experience</span>
          )}
          {agent.license_no && (
            <span>Lic. {agent.license_no}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-neutral-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="h-3 bg-neutral-200 rounded w-1/3" />
        <div className="h-3 bg-neutral-200 rounded w-full mt-2" />
        <div className="h-3 bg-neutral-200 rounded w-4/5" />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSuburb = searchParams.get('suburb') ?? '';
  const [suburb, setSuburb] = useState(initialSuburb);
  const [inputValue, setInputValue] = useState(initialSuburb);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAgents(suburb, page);

  function handleSearch() {
    const trimmed = inputValue.trim();
    setSuburb(trimmed);
    setPage(1);
    setSearchParams(trimmed ? { suburb: trimmed } : {});
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Find an Agent</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Connect with experienced local agents across Ahmedabad and Gujarat.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Search by suburb..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-btn text-sm font-medium hover:bg-brand-primary-dark transition-colors"
        >
          Search
        </button>
        {suburb && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setSuburb('');
              setPage(1);
              setSearchParams({});
            }}
            className="px-4 py-2.5 rounded-btn text-sm text-neutral-500 border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Active filter pill */}
      {suburb && (
        <p className="text-sm text-neutral-500 mb-4">
          Showing agents in <span className="font-medium text-neutral-800">"{suburb}"</span>
        </p>
      )}

      {/* Results */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-lg font-medium">Something went wrong</p>
          <p className="text-sm mt-1">Please try again later.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {data?.items.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-lg font-medium">No agents found</p>
              <p className="text-sm mt-1">
                {suburb ? `Try a different suburb or clear the filter.` : `No active agents at the moment.`}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {data?.items.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {(data?.totalPages ?? 1) > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-neutral-200 rounded-btn disabled:opacity-40 hover:bg-neutral-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">
                Page {page} of {data?.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === (data?.totalPages ?? 1)}
                className="px-4 py-2 text-sm border border-neutral-200 rounded-btn disabled:opacity-40 hover:bg-neutral-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
