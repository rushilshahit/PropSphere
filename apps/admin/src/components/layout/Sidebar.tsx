import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/properties', label: 'Properties', icon: '🏠' },
  { path: '/agencies', label: 'Agencies', icon: '🏢' },
  { path: '/agents', label: 'Agents', icon: '👤' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/suburbs', label: 'Suburbs', icon: '📍' },
  { path: '/schools', label: 'Schools', icon: '🏫' },
  { path: '/enquiries', label: 'Enquiries', icon: '✉' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/media', label: 'Media', icon: '🖼' },
  { path: '/featured', label: 'Featured', icon: '⭐' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-neutral-200 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-neutral-200 gap-2">
        <NavLink to="/dashboard" className="flex items-center">
          <img src="/logo.svg" alt="PropSphere" className="h-8 w-auto" />
        </NavLink>
        <span className="text-xs font-medium bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-badge">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )
            }
          >
            <span className="w-5 text-center text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
