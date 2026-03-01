'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import ConfirmDialog from '@/components/ConfirmDialog';
import SectionCard from '@/components/SectionCard';
import { api, getErrorMessage } from '@/lib/api';
import { clearStoredUser, getStoredUser } from '@/lib/auth';

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
  const [editMap, setEditMap] = useState({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAccount, setDialogAccount] = useState(null);

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
      setEditMap(
        Object.fromEntries(
          list.map((acc) => [
            acc.id,
            { name: acc.name || '', balance: Number(acc.balance || 0) },
          ]),
        ),
      );
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

  const updateAccount = async (accountId) => {
    const payload = editMap[accountId];
    if (!payload?.name?.trim()) {
      setError('Account name is required.');
      return;
    }

    setSavingId(accountId);
    setError('');
    setSuccess('');

    try {
      await api.put(`/accounts/${accountId}`, {
        name: payload.name.trim(),
        balance: Number(payload.balance || 0),
      });
      setSuccess('Account updated successfully.');
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
            <p className="muted mt-1">Create, update, and delete your accounts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/dashboard">Dashboard</Link>
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
          <div className="space-y-3">
            {accounts.map((acc) => {
              const draft = editMap[acc.id] || { name: '', balance: 0 };
              const isSaving = savingId === acc.id;
              const isDeleting = deletingId === acc.id;

              return (
                <div key={acc.id} className="rounded-xl border border-black/15 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-black/60">Name</label>
                      <input
                        className="field"
                        value={draft.name}
                        onChange={(e) =>
                          setEditMap((prev) => ({
                            ...prev,
                            [acc.id]: { ...prev[acc.id], name: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-black/60">Balance</label>
                      <input
                        className="field"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.balance}
                        onChange={(e) =>
                          setEditMap((prev) => ({
                            ...prev,
                            [acc.id]: {
                              ...prev[acc.id],
                              balance: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-black/60">Account ID</label>
                      <p className="rounded-lg border border-black/15 px-3 py-2 font-mono text-xs">{acc.id}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="btn-primary"
                      disabled={isSaving || isDeleting}
                      onClick={() => updateAccount(acc.id)}
                      type="button"
                    >
                      {isSaving ? 'Saving...' : 'Update'}
                    </button>
                    <button
                      className="btn-danger"
                      disabled={isSaving || isDeleting}
                      onClick={() => openDeleteDialog(acc)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

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
