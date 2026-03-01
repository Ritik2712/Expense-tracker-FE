'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import ConfirmDialog from '@/components/ConfirmDialog';
import SectionCard from '@/components/SectionCard';
import { api, getErrorMessage } from '@/lib/api';
import { clearStoredUser, getStoredUser } from '@/lib/auth';

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function AccountsPanel() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createName, setCreateName] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAccount, setDialogAccount] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', balance: 0 });

  const logout = () => {
    clearStoredUser();
    router.push('/login');
  };

  const loadAccounts = async () => {
    setError('');
    try {
      const res = await api.get('/accounts', { params: { page: 1, limit: 100 } });
      const list = Array.isArray(res.data) ? res.data : [];
      setAccounts(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.token) {
      router.replace('/login');
      return;
    }
    loadAccounts();
  }, [router]);

  const createAccount = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/accounts', { name: createName.trim() });
      setCreateName('');
      setSuccess('Account created successfully.');
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (account) => {
    setEditAccount(account);
    setEditForm({
      name: account?.name || '',
      balance: Number(account?.balance || 0),
    });
    setEditOpen(true);
  };

  const closeEditDialog = (force = false) => {
    if (savingId && !force) return;
    setEditOpen(false);
    setEditAccount(null);
    setEditForm({ name: '', balance: 0 });
  };

  const updateAccount = async () => {
    if (!editAccount?.id) return;
    if (!editForm.name.trim()) {
      setError('Account name is required.');
      return;
    }

    setSavingId(editAccount.id);
    setError('');
    setSuccess('');

    try {
      await api.put(`/accounts/${editAccount.id}`, {
        name: editForm.name.trim(),
        balance: Number(editForm.balance || 0),
      });
      setSuccess('Account updated successfully.');
      closeEditDialog(true);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId('');
    }
  };

  const openDeleteDialog = (account) => {
    setDialogAccount(account);
    setDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deletingId) return;
    setDialogOpen(false);
    setDialogAccount(null);
  };

  const confirmDelete = async () => {
    if (!dialogAccount?.id) return;

    setDeletingId(dialogAccount.id);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/accounts/${dialogAccount.id}`);
      setSuccess('Account deleted successfully.');
      setDialogOpen(false);
      setDialogAccount(null);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <main className="shell space-y-4">
      <header className="rounded-2xl border border-black/15 p-5">
        <p className="muted mb-2 uppercase tracking-[0.2em]">Expense Tracker</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
            <p className="muted mt-1">Click any account row to view account transactions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/dashboard">Dashboard</Link>
            <Link className="btn-secondary" href="/users">User Settings</Link>
            <button className="btn-secondary" onClick={loadAccounts} type="button">Refresh</button>
            <button className="btn-primary" onClick={logout} type="button">Logout</button>
          </div>
        </div>
      </header>

      {error && <p className="rounded-lg border border-black/20 bg-black/[0.03] px-3 py-2 text-sm">{error}</p>}
      {success && <p className="rounded-lg border border-black/20 px-3 py-2 text-sm">{success}</p>}

      <SectionCard title="Create Account">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={createAccount}>
          <input
            className="field"
            placeholder="Account name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
          />
          <button className="btn-primary" disabled={creating} type="submit">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title={`Your Accounts (${accounts.length})`}>
        {loading ? (
          <p className="muted">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="muted">No accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="px-2 py-2 font-medium">Account Name</th>
                  <th className="px-2 py-2 font-medium">Balance</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => {
                  const isDeleting = deletingId === acc.id;
                  const isSaving = savingId === acc.id;

                  return (
                    <tr
                      key={acc.id}
                      className="cursor-pointer border-b border-black/10 last:border-0 hover:bg-black/[0.03]"
                      onClick={() => router.push(`/accounts/${acc.id}`)}
                    >
                      <td className="px-2 py-2 font-medium">{acc.name}</td>
                      <td className="px-2 py-2">{formatCurrency(acc.balance)}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn-secondary"
                            disabled={isDeleting || isSaving}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(acc);
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger"
                            disabled={isDeleting || isSaving}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(acc);
                            }}
                            type="button"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/20 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold tracking-tight">Edit Account</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-black/60">Name</label>
                <input
                  className="field"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  type="text"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-black/60">Balance</label>
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.balance}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, balance: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={closeEditDialog} disabled={Boolean(savingId)} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={updateAccount} disabled={Boolean(savingId)} type="button">
                {savingId ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialogOpen}
        title="Delete Account"
        message={`Are you sure you want to delete \"${dialogAccount?.name || 'this account'}\"? This action cannot be undone.`}
        confirmLabel="Delete Account"
        loading={Boolean(deletingId)}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </main>
  );
}

export default function AccountsPage() {
  return (
    <AuthGuard>
      <AccountsPanel />
    </AuthGuard>
  );
}
