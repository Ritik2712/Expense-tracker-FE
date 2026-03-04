"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import SectionCard from "@/components/SectionCard";
import { api, getErrorMessage } from "@/lib/api";
import { clearStoredUser, getStoredUser } from "@/lib/auth";

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function AccountDetailsPanel() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id;

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const logout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const loadAccount = async ({ showRefresh = false } = {}) => {
    const activeUser = getStoredUser();
    if (!activeUser?.token) {
      router.replace("/login");
      return;
    }

    setError("");
    if (showRefresh) setRefreshing(true);

    try {
      if (activeUser?.role && activeUser.role !== "admin") {
        router.replace("/forbidden");
        return;
      }

      const res = await api.get(`/admin/accounts/${accountId}`);
      setAccount(res.data.account || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!accountId) return;
    loadAccount();
  }, [accountId]);

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading account details...</p>
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
              Admin Account Details
            </h1>
            <p className="muted mt-1">Account ID: {accountId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/admin">
              Admin Panel
            </Link>
            <button
              className="btn-secondary"
              onClick={() => loadAccount({ showRefresh: true })}
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

      <SectionCard title="Account">
        {error ? (
          <p className="muted">
            Could not load account details right now. Use refresh to try again.
          </p>
        ) : !account ? (
          <p className="muted">Account not found.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">ID:</span>{" "}
              <span className="font-mono text-xs">{account.id || "-"}</span>
            </p>
            <p>
              <span className="font-medium">Name:</span> {account.name || "-"}
            </p>
            <p>
              <span className="font-medium">Balance:</span>{" "}
              {formatCurrency(account.balance)}
            </p>
            <p>
              <span className="font-medium">Owner User ID:</span>{" "}
              <span className="font-mono text-xs">
                {account.user_id || "-"}
              </span>
            </p>
          </div>
        )}
      </SectionCard>
    </main>
  );
}

export default function AdminAccountDetailsPage() {
  return (
    <AuthGuard>
      <AccountDetailsPanel />
    </AuthGuard>
  );
}
