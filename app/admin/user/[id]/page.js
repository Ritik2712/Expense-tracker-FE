"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PageSkeleton from "@/components/PageSkeleton";
import SectionCard from "@/components/SectionCard";
import { api, getErrorMessage } from "@/lib/api";
import { clearStoredUser, getStoredUser } from "@/lib/auth";

function UserDetailsPanel() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const logout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const loadUser = async ({ showRefresh = false } = {}) => {
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

      const res = await api.get(`/admin/users/${userId}`);
      setTargetUser(res.data.user || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadUser();
  }, [userId]);

  if (loading) {
    return <PageSkeleton title="Loading User Details" rows={4} />;
  }

  return (
    <main className="shell space-y-4">
      <header className="rounded-2xl border border-black/15 p-5">
        <p className="muted mb-2 uppercase tracking-[0.2em]">Expense Tracker</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin User Details
            </h1>
            <p className="muted mt-1">User ID: {userId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/admin">
              Admin Panel
            </Link>
            <button
              className="btn-secondary"
              onClick={() => loadUser({ showRefresh: true })}
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

      <SectionCard title="User">
        {error ? (
          <p className="muted">
            Could not load user details right now. Use refresh to try again.
          </p>
        ) : !targetUser ? (
          <p className="muted">User not found.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">ID:</span>{" "}
              <span className="font-mono text-xs">{targetUser.id || "-"}</span>
            </p>
            <p>
              <span className="font-medium">Name:</span>{" "}
              {targetUser.name || "-"}
            </p>
            <p>
              <span className="font-medium">Role:</span>{" "}
              {targetUser.role || "-"}
            </p>
          </div>
        )}
      </SectionCard>
    </main>
  );
}

export default function AdminUserDetailsPage() {
  return (
    <AuthGuard>
      <UserDetailsPanel />
    </AuthGuard>
  );
}
