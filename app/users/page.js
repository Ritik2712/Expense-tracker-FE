'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageSkeleton from '@/components/PageSkeleton';
import SectionCard from '@/components/SectionCard';
import { api, getErrorMessage } from '@/lib/api';
import { clearStoredUser, getStoredUser } from '@/lib/auth';

function UserSettingsPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const logout = () => {
    clearStoredUser();
    router.push('/login');
  };

  const fetchUser = async () => {
    const activeUser = getStoredUser();
    if (!activeUser?.token) {
      router.replace('/login');
      return;
    }

    setError('');
    setSuccess('');

    setUser(activeUser);
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const closeDialog = () => {
    if (deleting) return;
    setDialogOpen(false);
  };

  const deleteUser = async () => {
    if (!user?.id) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/users/${user.id}`);
      clearStoredUser();
      setSuccess('User deleted successfully. Redirecting to login...');
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <PageSkeleton title="Loading User Settings" rows={4} />;
  }

  return (
    <main className="shell space-y-4">
      <header className="rounded-2xl border border-black/15 p-5">
        <p className="muted mb-2 uppercase tracking-[0.2em]">Expense Tracker</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">User Settings</h1>
            <p className="muted mt-1">Manage your profile and account deletion.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/dashboard">Dashboard</Link>
            <Link className="btn-secondary" href="/accounts">Accounts</Link>
            <button className="btn-primary" onClick={logout} type="button">Logout</button>
          </div>
        </div>
      </header>

      {error && <p className="rounded-lg border border-black/20 bg-black/[0.03] px-3 py-2 text-sm">{error}</p>}
      {success && <p className="rounded-lg border border-black/20 px-3 py-2 text-sm">{success}</p>}

      <SectionCard title="Profile">
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Name:</span> {user?.name || '-'}</p>
          <p><span className="font-medium">Role:</span> {user?.role || '-'}</p>
          <p><span className="font-medium">User ID:</span> <span className="font-mono text-xs">{user?.id || '-'}</span></p>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone">
        <p className="muted">Deleting user will remove your account access permanently.</p>
        <button className="btn-danger" onClick={() => setDialogOpen(true)} type="button">
          Delete User
        </button>
      </SectionCard>

      <ConfirmDialog
        open={dialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete user \"${user?.name || 'this user'}\"? This action cannot be undone.`}
        confirmLabel="Delete User"
        loading={deleting}
        onCancel={closeDialog}
        onConfirm={deleteUser}
      />
    </main>
  );
}

export default function UserSettingsPage() {
  return (
    <AuthGuard>
      <UserSettingsPanel />
    </AuthGuard>
  );
}
