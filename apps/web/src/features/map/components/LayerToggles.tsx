import { School } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSchoolsLayer, selectShowSchoolsLayer } from '../store/mapSlice';

export function LayerToggles() {
  const dispatch = useDispatch();
  const showSchools = useSelector(selectShowSchoolsLayer);

  return (
    <div className="absolute bottom-8 left-4 z-10">
      <button
        type="button"
        onClick={() => dispatch(toggleSchoolsLayer())}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          border shadow-md transition-colors
          ${showSchools
            ? 'bg-brand-primary text-white border-brand-primary'
            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }
        `}
      >
        <School className="w-4 h-4" />
        Schools
      </button>
    </div>
  );
}
