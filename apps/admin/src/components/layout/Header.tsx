import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/features/auth/store/authSlice';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';

export function Header() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-end px-6 gap-4">
      <span className="text-sm text-neutral-600">
        {user?.full_name ?? user?.email}
      </span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  );
}
