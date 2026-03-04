"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import ConfirmDialog from "@/components/ConfirmDialog";
import SectionCard from "@/components/SectionCard";
import { api, getErrorMessage } from "@/lib/api";
import { clearStoredUser, getStoredUser } from "@/lib/auth";

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function AdminPanel() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const logout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const loadAdminData = async ({ showRefresh = false } = {}) => {
    const activeUser = getStoredUser();
    if (!activeUser?.token) {
      router.replace("/login");
      return;
    }

    setError("");
    setSuccess("");
    if (showRefresh) setRefreshing(true);

    try {
      setMe(activeUser);

      if (activeUser?.role && activeUser.role !== "admin") {
        router.replace("/forbidden");
        return;
      }

      const [usersRes, accountsRes, txRes] = await Promise.all([
        api.get("/admin/users", { params: { page: 1, limit: 100 } }),
        api.get("/admin/accounts", { params: { page: 1, limit: 100 } }),
        api.get("/admin/transactions", { params: { page: 1, limit: 100 } }),
      ]);

      setUsers(extractList(usersRes.data));
      setAccounts(extractList(accountsRes.data));
      setTransactions(extractList(txRes.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const openDeleteDialog = (target) => {
    setDialogTarget(target);
    setDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDialogOpen(false);
    setDialogTarget(null);
  };

  const deleteTarget = async () => {
    if (!dialogTarget?.id || !dialogTarget?.type) return;

    const endpointByType = {
      user: `/admin/users/${dialogTarget.id}`,
      account: `/admin/accounts/${dialogTarget.id}`,
      transaction: `/admin/transactions/${dialogTarget.id}`,
    };

    const endpoint = endpointByType[dialogTarget.type];
    if (!endpoint) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await api.delete(endpoint);
      setSuccess(`${dialogTarget.type} deleted successfully.`);
      setDialogOpen(false);
      setDialogTarget(null);
      await loadAdminData({ showRefresh: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const isSelfUser = (userId) => userId && userId === me?.id;

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading admin panel...</p>
      </main>
    );
  }

  return (
    <main className="shell space-y-4">
      <header className="rounded-2xl border border-black/15 p-5">
        <p className="muted mb-2 uppercase tracking-[0.2em]">Expense Tracker</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Panel
            </h1>
            <p className="muted mt-1">
              Manage users, accounts, and transactions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/dashboard">
              Dashboard
            </Link>
            <Link className="btn-secondary" href="/accounts">
              Accounts
            </Link>
            <button
              className="btn-secondary"
              onClick={() => loadAdminData({ showRefresh: true })}
              type="button"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button className="btn-primary" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-black/20 bg-black/[0.03] px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-black/20 px-3 py-2 text-sm">
          {success}
        </p>
      )}

      <SectionCard title={`Users (${users.length})`}>
        {users.length === 0 ? (
          <p className="muted">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Role</th>
                  <th className="px-2 py-2 font-medium">User ID</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const self = isSelfUser(user.id);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-black/10 last:border-0"
                    >
                      <td className="px-2 py-2">{user.name || "-"}</td>
                      <td className="px-2 py-2">{user.role || "-"}</td>
                      <td className="px-2 py-2 font-mono text-xs">{user.id}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link className="btn-secondary" href={`/admin/user/${user.id}`}>
                            View
                          </Link>
                          <button
                            className="btn-danger"
                            disabled={self || deleting}
                            onClick={() =>
                              openDeleteDialog({
                                type: "user",
                                id: user.id,
                                label: user.name || user.id,
                              })
                            }
                            type="button"
                          >
                            {self ? "Current User" : "Delete"}
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

      <SectionCard title={`Accounts (${accounts.length})`}>
        {accounts.length === 0 ? (
          <p className="muted">No accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Balance</th>
                  <th className="px-2 py-2 font-medium">Account ID</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-black/10 last:border-0"
                  >
                    <td className="px-2 py-2">{account.name || "-"}</td>
                    <td className="px-2 py-2">
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {account.id}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" href={`/admin/account/${account.id}`}>
                          View
                        </Link>
                        <button
                          className="btn-danger"
                          disabled={deleting}
                          onClick={() =>
                            openDeleteDialog({
                              type: "account",
                              id: account.id,
                              label: account.name || account.id,
                            })
                          }
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title={`Transactions (${transactions.length})`}>
        {transactions.length === 0 ? (
          <p className="muted">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Transaction ID</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-black/10 last:border-0"
                  >
                    <td className="px-2 py-2">{tx.transaction_type || "-"}</td>
                    <td className="px-2 py-2">{tx.description || "-"}</td>
                    <td className="px-2 py-2">{formatCurrency(tx.amount)}</td>
                    <td className="px-2 py-2 font-mono text-xs">{tx.id}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" href={`/admin/transaction/${tx.id}`}>
                          View
                        </Link>
                        <button
                          className="btn-danger"
                          disabled={deleting}
                          onClick={() =>
                            openDeleteDialog({
                              type: "transaction",
                              id: tx.id,
                              label: tx.description || tx.id,
                            })
                          }
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={dialogOpen}
        title={`Delete ${dialogTarget?.type || ""}`}
        message={`Are you sure you want to delete \"${dialogTarget?.label || "this item"}\"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={closeDeleteDialog}
        onConfirm={deleteTarget}
      />
    </main>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPanel />
    </AuthGuard>
  );
}
