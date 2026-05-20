import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Clock, HandCoins, LayoutDashboard, List, LogOut, BookmarkCheck, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';
import { selectIsAgent, selectIsSeller } from '@/features/auth/store/authSlice';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { NotificationCentre } from '@/features/alerts/components/NotificationCentre';

export function Header() {
  const { user, session, isAuthenticated, signOut } = useAuth();
  const isAgent = useAppSelector(selectIsAgent);
  const isSeller = useAppSelector(selectIsSeller);
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({
    open: false,
    mode: 'login',
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = location.state as { requireAuth?: boolean } | null;
    if (state?.requireAuth && !isAuthenticated) {
      setAuthModal({ open: true, mode: 'login' });
    }
  }, [location.state, isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-brand-primary' : 'text-neutral-700 hover:text-neutral-900'
    }`;

  const avatarInitials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email ?? session?.user?.email)?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center">
              <img src="/logo.svg" alt="PropSphere" className="h-8 w-auto" />
            </NavLink>
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/buy" className={navLinkClass}>Buy</NavLink>
              <NavLink to="/rent" className={navLinkClass}>Rent</NavLink>
              <NavLink to="/sold" className={navLinkClass}>Sold</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && <NotificationCentre />}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name ?? 'Avatar'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-semibold">
                      {avatarInitials}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-card shadow-card-hover py-1 z-50">
                    {isAgent && (
                      <NavLink
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </NavLink>
                    )}
                    {isSeller && (
                      <NavLink
                        to="/account/my-listings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <List className="w-4 h-4" />
                        My Listings
                      </NavLink>
                    )}
                    <NavLink
                      to="/account/saved"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                      My Saved
                    </NavLink>
                    <NavLink
                      to="/account/searches"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Search className="w-4 h-4" />
                      Saved Searches
                    </NavLink>
                    <NavLink
                      to="/account/history"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Clock className="w-4 h-4" />
                      Recently Viewed
                    </NavLink>
                    <NavLink
                      to="/account/enquiries"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Enquiries
                    </NavLink>
                    <NavLink
                      to="/account/offers"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <HandCoins className="w-4 h-4" />
                      My Offers
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        void signOut();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthModal({ open: true, mode: 'login' })}
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModal({ open: true, mode: 'register' })}
                  className="text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-btn hover:bg-brand-primary-dark transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        mode={authModal.mode}
        isOpen={authModal.open}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
