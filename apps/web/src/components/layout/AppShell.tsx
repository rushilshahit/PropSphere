import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { CompareDrawer } from '@/features/collections/components/CompareDrawer';
import { RoleOverlay } from '@/features/auth/components/RoleOverlay';
import { useAppSelector } from '@/store/hooks';
import { selectNeedsRoleSelection } from '@/features/auth/store/authSlice';

export function AppShell() {
  const needsRoleSelection = useAppSelector(selectNeedsRoleSelection);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareDrawer />
      {needsRoleSelection && <RoleOverlay />}
    </div>
  );
}
