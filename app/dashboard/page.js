"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import SectionCard from "@/components/SectionCard";
import { api, getErrorMessage } from "@/lib/api";
import { clearStoredUser, getStoredUser, setStoredUser } from "@/lib/auth";

const TX_PAGE_LIMIT = 100;
const MAX_PAGES = 50;

function DashboardPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [accountName, setAccountName] = useState("Main Account");
  const [creatingAccount, setCreatingAccount] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    description: "",
    transactionType: "Expense",
    accountId: "",
  });

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

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  const logout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const fetchAllUserTransactions = async (userId) => {
    const all = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await api.get("/transactions/user/all", {
        params: { user_id: userId, page, limit: TX_PAGE_LIMIT },
      });

      const batch = Array.isArray(res.data) ? res.data : [];
      all.push(...batch);

      if (batch.length < TX_PAGE_LIMIT) {
        break;
      }
    }

    return all;
  };

  const fetchDashboardData = async ({ showRefresh = false } = {}) => {
    const activeUser = getStoredUser();
    if (!activeUser?.id) {
      setError("User session missing. Please login again.");
      setLoading(false);
      return;
    }

    setError("");
    setSuccess("");
    if (showRefresh) setRefreshing(true);

    try {
      const [meRes, accountsRes, txs] = await Promise.all([
        api.get("/users/me"),
        api.get("/accounts", { params: { page: 1, limit: 100 } }),
        fetchAllUserTransactions(activeUser.id),
      ]);

      const mergedUser = { ...activeUser, ...(meRes.data.user || {}) };
      setStoredUser(mergedUser);
      setUser(mergedUser);

      const fetchedAccounts = Array.isArray(accountsRes.data)
        ? accountsRes.data
        : [];
      setAccounts(fetchedAccounts);
      setTransactions(txs);

      setForm((prev) => ({
        ...prev,
        accountId: prev.accountId || fetchedAccounts[0]?.id || "",
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    fetchDashboardData();
  }, []);

  const createAccount = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    setCreatingAccount(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/accounts", { name: accountName.trim() });
      setSuccess("Account created.");
      setAccountName("Main Account");
      await fetchDashboardData({ showRefresh: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreatingAccount(false);
    }
  };

  const createTransaction = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      setError("User not loaded. Please refresh.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        "/transactions",
        {
          amount: Number(form.amount),
          description: form.description,
          transaction_type: form.transactionType,
          account_id: form.accountId,
        },
        { params: { user_id: user.id } },
      );

      setSuccess("Transaction added successfully.");
      setForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
        transactionType: "Expense",
      }));
      await fetchDashboardData({ showRefresh: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading dashboard...</p>
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
              User Dashboard
            </h1>
            <p className="muted mt-1">
              {user?.name || "User"} ({user?.role || "user"})
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="btn-secondary" href="/accounts">
              Accounts
            </Link>
            <button
              className="btn-secondary"
              onClick={() => fetchDashboardData({ showRefresh: true })}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button className="btn-primary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="panel">
          <p className="muted">Total Income</p>
          <p className="mt-2 text-2xl font-semibold">
            ${totals.income.toFixed(2)}
          </p>
        </div>
        <div className="panel">
          <p className="muted">Total Expense</p>
          <p className="mt-2 text-2xl font-semibold">
            ${totals.expense.toFixed(2)}
          </p>
        </div>
        <div className="panel">
          <p className="muted">Remaining Balance</p>
          <p className="mt-2 text-2xl font-semibold">
            ${totals.balance.toFixed(2)}
          </p>
        </div>
      </section>

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

      {accounts.length === 0 ? (
        <SectionCard title="Create Account First">
          <p className="muted">
            You need at least one account before creating transactions.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={createAccount}
          >
            <input
              className="field"
              placeholder="Account name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
            <button
              className="btn-primary"
              disabled={creatingAccount}
              type="submit"
            >
              {creatingAccount ? "Creating..." : "Create Account"}
            </button>
          </form>
        </SectionCard>
      ) : (
        <SectionCard title="Add Transaction">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={createTransaction}
          >
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              required
            />

            <select
              className="field"
              value={form.transactionType}
              onChange={(e) =>
                setForm((prev) => ({
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
              className="field md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />

            <select
              className="field"
              value={form.accountId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, accountId: e.target.value }))
              }
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.id.slice(0, 8)}...)
                </option>
              ))}
            </select>

            <button className="btn-primary" disabled={submitting} type="submit">
              {submitting ? "Saving..." : "Create Transaction"}
            </button>
          </form>
        </SectionCard>
      )}

      <SectionCard title={`Transactions (${transactions.length})`}>
        {transactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left">
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Account</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const uiType = tx.transaction_type;
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-black/10 last:border-0"
                    >
                      <td className="px-2 py-2">{uiType}</td>
                      <td className="px-2 py-2">{tx.description}</td>
                      <td className="px-2 py-2 font-medium">
                        ${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {tx.account_id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPanel />
    </AuthGuard>
  );
}
