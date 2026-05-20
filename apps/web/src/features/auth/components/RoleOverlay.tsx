import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, setNeedsRoleSelection, setUser } from '@/features/auth/store/authSlice';
import { Button } from '@/components/ui';
import { RegisterRoleSelector, type SelectableRole } from './RegisterRoleSelector';

const ROLE_REDIRECT: Record<SelectableRole, string> = {
  seller: '/post-property',
  agent: '/become-an-agent',
  buyer: '/',
};

export function RoleOverlay() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('buyer');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!user) return;
    setLoading(true);
    const dbRole = selectedRole === 'agent' ? 'pending_agent' : selectedRole;
    await supabase.from('profiles').update({ role: dbRole }).eq('id', user.id);
    dispatch(setUser({ ...user, role: dbRole }));
    dispatch(setNeedsRoleSelection(false));
    setLoading(false);
    navigate(ROLE_REDIRECT[selectedRole]);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Welcome to PropSphere!</h2>
        <p className="text-sm text-neutral-500 mb-8">Tell us a bit about yourself to get started.</p>
        <RegisterRoleSelector value={selectedRole} onChange={setSelectedRole} />
        <Button className="w-full mt-6" onClick={handleConfirm} loading={loading}>
          Get started
        </Button>
      </div>
    </div>
  );
}
