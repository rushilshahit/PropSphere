import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AgentFinderTeaser() {
  const navigate = useNavigate();
  const [suburbInput, setSuburbInput] = useState('');

  function handleFind() {
    navigate(`/agents?suburb=${encodeURIComponent(suburbInput)}`);
  }

  return (
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — illustration placeholder */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[400px] h-[280px] bg-neutral-200 rounded-card flex items-center justify-center text-neutral-400 text-sm">
              Agent illustration
            </div>
          </div>

          {/* Right — content */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
              Connect with top local agents
            </h2>
            <p className="text-neutral-500 mb-6">
              Our agents know every street, every suburb. Get expert advice from someone who
              lives and breathes your market.
            </p>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Search by suburb..."
                value={suburbInput}
                onChange={(e) => setSuburbInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                className="flex-1 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={handleFind}
                className="bg-brand-primary text-white px-5 py-2.5 rounded-btn text-sm font-medium hover:bg-brand-primary-dark transition-colors"
              >
                Find an agent
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-neutral-300 border-2 border-white"
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-500">500+ verified agents</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
