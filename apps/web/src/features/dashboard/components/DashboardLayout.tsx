import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, List, MessageSquare, FileText } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/listings', label: 'Listings', icon: List, end: false },
  { to: '/dashboard/enquiries', label: 'Enquiries', icon: MessageSquare, end: false },
  { to: '/dashboard/offers', label: 'Offers', icon: FileText, end: false },
];

export function DashboardLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
      <aside className="w-48 shrink-0">
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
