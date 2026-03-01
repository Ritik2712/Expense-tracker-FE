'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearStoredUser } from '@/lib/auth';

export default function ForbiddenPage() {
  const router = useRouter();

  const backToLogin = () => {
    clearStoredUser();
    router.replace('/login');
  };

  return (
    <main className="shell">
      <section className="panel max-w-2xl">
        <p className="muted mb-2 uppercase tracking-[0.2em]">Expense Tracker</p>
        <h1 className="text-3xl font-semibold tracking-tight">403 Forbidden</h1>
        <p className="muted mt-2">
          You do not have permission to access this resource.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/dashboard">
            Go to Dashboard
          </Link>
          <button className="btn-primary" onClick={backToLogin} type="button">
            Go to Login
          </button>
        </div>
      </section>
    </main>
  );
}
