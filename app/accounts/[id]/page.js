"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import ConfirmDialog from "@/components/ConfirmDialog";
import SectionCard from "@/components/SectionCard";
import { api, getErrorMessage } from "@/lib/api";
import { clearStoredUser, getStoredUser } from "@/lib/auth";

const TX_PAGE_LIMIT = 100;
const MAX_PAGES = 50;

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function AccountDetailsPanel() {
  const params = useParams();
  const router = useRouter();
  const accountId = params?.id;

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editTxOpen, setEditTxOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({
    amount: "",
    description: "",
    transactionType: "Expense",
  });
  const [savingTxId, setSavingTxId] = useState("");

  const [deleteTxDialogOpen, setDeleteTxDialogOpen] = useState(false);
  const [deleteTx, setDeleteTx] = useState(null);
  const [deletingTxId, setDeletingTxId] = useState("");

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount || 0);
      if (tx.transaction_type === "Income") {
        income += amount;
      } else {
        expense += amount;
      }
    }

    return { income, expense };
  }, [transactions]);

  const logout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const fetchAllUserTransactions = async (resolvedUserId) => {
    const all = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await api.get("/transactions/user/all", {
        params: { page, limit: TX_PAGE_LIMIT },
      });

      const batch = Array.isArray(res.data) ? res.data : [];
      all.push(...batch);

      if (batch.length < TX_PAGE_LIMIT) {
        break;
      }
    }

    return all;
  };

  const fetchAccountData = async ({ showRefresh = false } = {}) => {
    const activeUser = getStoredUser();
    if (!activeUser?.token) {
      router.replace("/login");
      return;
    }

    setError("");
    setSuccess("");
    if (showRefresh) setRefreshing(true);

    try {
      const accountsRes = await api.get("/accounts", {
        params: { page: 1, limit: 100 },
      });

      if (!activeUser?.id) {
        throw new Error("User session missing. Please login again.");
      }

      setUserId(activeUser.id);
      const allTxs = await fetchAllUserTransactions(activeUser.id);

      const accountList = Array.isArray(accountsRes.data)
        ? accountsRes.data
        : [];
      const foundAccount = accountList.find((acc) => acc.id === accountId);
      setAccount(foundAccount || null);

      const accountTxs = allTxs.filter((tx) => tx.account_id === accountId);
      setTransactions(accountTxs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!accountId) return;
    fetchAccountData();
  }, [accountId]);

  const openEditTransaction = (tx) => {
    setEditTx(tx);
    setEditTxForm({
      amount: Number(tx?.amount || 0),
      description: tx?.description || "",
      transactionType: tx?.transaction_type || "Expense",
    });
    setEditTxOpen(true);
  };

  const closeEditTransaction = (force = false) => {
    if (savingTxId && !force) return;
    setEditTxOpen(false);
    setEditTx(null);
    setEditTxForm({ amount: "", description: "", transactionType: "Expense" });
  };

  const updateTransaction = async () => {
    if (!editTx?.id || !userId) return;

    setSavingTxId(editTx.id);
    setError("");
    setSuccess("");

    try {
      await api.put(`/transactions/${editTx.id}`, {
        amount: Number(editTxForm.amount),
        description: editTxForm.description,
        transaction_type: editTxForm.transactionType,
        account_id: accountId,
      });

      setSuccess("Transaction updated successfully.");
      closeEditTransaction(true);
      await fetchAccountData({ showRefresh: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingTxId("");
    }
  };

  const openDeleteTransactionDialog = (tx) => {
    setDeleteTx(tx);
    setDeleteTxDialogOpen(true);
  };

  const closeDeleteTransactionDialog = () => {
    if (deletingTxId) return;
    setDeleteTxDialogOpen(false);
    setDeleteTx(null);
  };

  const deleteTransaction = async () => {
    if (!deleteTx?.id || !userId) return;

    setDeletingTxId(deleteTx.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/transactions/${deleteTx.id}`);

      setSuccess("Transaction deleted successfully.");
      setDeleteTxDialogOpen(false);
      setDeleteTx(null);
      await fetchAccountData({ showRefresh: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingTxId("");
    }
  };

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading account...</p>
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
              {account?.name || "Account Not Found"}
            </h1>
            <p className="muted mt-1">Account ID: {accountId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/accounts">
              Accounts
            </Link>
            <Link className="btn-secondary" href="/dashboard">
              Dashboard
            </Link>
            <Link className="btn-secondary" href="/users">
              User Settings
            </Link>
            <button
              className="btn-secondary"
              onClick={() => fetchAccountData({ showRefresh: true })}
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

      {!account ? (
        <SectionCard title="Account">
          {error ? (
            <p className="muted">
              Could not load account details right now. Use refresh to try
              again.
            </p>
          ) : (
            <p className="muted">
              This account does not exist or is not accessible.
            </p>
          )}
        </SectionCard>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <div className="panel">
              <p className="muted">Current Balance</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(account.balance)}
              </p>
            </div>
            <div className="panel">
              <p className="muted">Total Income</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(totals.income)}
              </p>
            </div>
            <div className="panel">
              <p className="muted">Total Expense</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(totals.expense)}
              </p>
            </div>
          </section>

          <SectionCard title={`Transactions (${transactions.length})`}>
            {transactions.length === 0 ? (
              <p className="muted">No transactions for this account.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/15 text-left">
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Description</th>
                      <th className="px-2 py-2 font-medium">Amount</th>
                      <th className="px-2 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isSaving = savingTxId === tx.id;
                      const isDeleting = deletingTxId === tx.id;

                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-black/10 last:border-0"
                        >
                          <td className="px-2 py-2">{tx.transaction_type}</td>
                          <td className="px-2 py-2">{tx.description}</td>
                          <td className="px-2 py-2 font-medium">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="btn-secondary"
                                onClick={() => openEditTransaction(tx)}
                                disabled={isSaving || isDeleting}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() => openDeleteTransactionDialog(tx)}
                                disabled={isSaving || isDeleting}
                                type="button"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
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
        </>
      )}

      {editTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/20 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold tracking-tight">
              Edit Transaction
            </h2>
            <div className="mt-4 space-y-3">
              <input
                className="field"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={editTxForm.amount}
                onChange={(e) =>
                  setEditTxForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
              />

              <select
                className="field"
                value={editTxForm.transactionType}
                onChange={(e) =>
                  setEditTxForm((prev) => ({
                    ...prev,
                    transactionType: e.target.value,
                  }))
                }
                required
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>

              <input
                className="field"
                placeholder="Description"
                value={editTxForm.description}
                onChange={(e) =>
                  setEditTxForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => closeEditTransaction()}
                disabled={Boolean(savingTxId)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={updateTransaction}
                disabled={Boolean(savingTxId)}
                type="button"
              >
                {savingTxId ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTxDialogOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete Transaction"
        loading={Boolean(deletingTxId)}
        onCancel={closeDeleteTransactionDialog}
        onConfirm={deleteTransaction}
      />
    </main>
  );
}

export default function AccountDetailsPage() {
  return (
    <AuthGuard>
      <AccountDetailsPanel />
    </AuthGuard>
  );
}
