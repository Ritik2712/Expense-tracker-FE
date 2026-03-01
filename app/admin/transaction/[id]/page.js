"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import SectionCard from "@/components/SectionCard";
import { api, getErrorMessage } from "@/lib/api";
import { clearStoredUser, getStoredUser, setStoredUser } from "@/lib/auth";

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function TransactionDetailsPanel() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params?.id;

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const logout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const loadTransaction = async ({ showRefresh = false } = {}) => {
    const activeUser = getStoredUser();
    if (!activeUser?.token) {
      router.replace("/login");
      return;
    }

    setError("");
    if (showRefresh) setRefreshing(true);

    try {
      const meRes = await api.get("/users/me");
      const mergedUser = { ...activeUser, ...(meRes.data.user || {}) };
      setStoredUser(mergedUser);

      if (mergedUser?.role !== "admin") {
        router.replace("/forbidden");
        return;
      }

      const res = await api.get(`/admin/transactions/${transactionId}`);
      setTransaction(res.data.transaction || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!transactionId) return;
    loadTransaction();
  }, [transactionId]);

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading transaction details...</p>
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
              Admin Transaction Details
            </h1>
            <p className="muted mt-1">Transaction ID: {transactionId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/admin">
              Admin Panel
            </Link>
            <button
              className="btn-secondary"
              onClick={() => loadTransaction({ showRefresh: true })}
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

      <SectionCard title="Transaction">
        {!transaction ? (
          <p className="muted">Transaction not found.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">ID:</span>{" "}
              <span className="font-mono text-xs">{transaction.id || "-"}</span>
            </p>
            <p>
              <span className="font-medium">Type:</span>{" "}
              {transaction.transaction_type || "-"}
            </p>
            <p>
              <span className="font-medium">Description:</span>{" "}
              {transaction.description || "-"}
            </p>
            <p>
              <span className="font-medium">Amount:</span>{" "}
              {formatCurrency(transaction.amount)}
            </p>
            <p>
              <span className="font-medium">Account ID:</span>{" "}
              <span className="font-mono text-xs">
                {transaction.account_id || "-"}
              </span>
            </p>
            <p>
              <span className="font-medium">User ID:</span>{" "}
              <span className="font-mono text-xs">
                {transaction.user_id || "-"}
              </span>
            </p>
          </div>
        )}
      </SectionCard>
    </main>
  );
}

export default function AdminTransactionDetailsPage() {
  return (
    <AuthGuard>
      <TransactionDetailsPanel />
    </AuthGuard>
  );
}
