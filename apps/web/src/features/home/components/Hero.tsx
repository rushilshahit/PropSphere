import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLocation } from '@/features/search/store/searchSlice';
import { SearchWidget } from './SearchWidget';

const POPULAR_SUBURBS = [
  { label: 'Navrangpura', query: 'Navrangpura' },
  { label: 'Satellite', query: 'Satellite' },
  { label: 'Bopal', query: 'Bopal' },
  { label: 'Vastrapur', query: 'Vastrapur' },
  { label: 'Prahlad Nagar', query: 'Prahlad Nagar' },
];

export function Hero() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleChipClick(query: string) {
    dispatch(setLocation(query));
    navigate(`/buy?q=${encodeURIComponent(query)}`);
  }

  return (
    <section
      className="relative min-h-[520px] md:min-h-[600px] flex items-center"
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(26,86,219,0.85) 0%, rgba(14,27,77,0.90) 100%), url(https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">
          Find your place.
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-8">
          Search thousands of properties for sale and rent across India.
        </p>

        <div className="mb-6">
          <SearchWidget />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-white/60 text-sm self-center">Popular:</span>
          {POPULAR_SUBURBS.map((suburb) => (
            <button
              key={suburb.query}
              type="button"
              onClick={() => handleChipClick(suburb.query)}
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-badge px-3 py-1.5 text-sm hover:bg-white/30 transition cursor-pointer"
            >
              {suburb.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
