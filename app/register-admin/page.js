'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { setStoredUser } from '@/lib/auth';

export default function RegisterAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/admin', form);
      setStoredUser(res.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl place-items-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-black/15 bg-white p-6 shadow-lg shadow-black/10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-black/60">Expense Tracker</p>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-black">Register Admin</h1>
        <p className="mb-6 text-sm text-black/60">Create an admin account for management routes.</p>

        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-black"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-black"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
        </form>

        {error && <p className="mt-3 rounded-lg border border-black/20 bg-black/[0.03] px-3 py-2 text-sm text-black">{error}</p>}

        <p className="mt-5 text-sm text-black">
          Already have an account?{' '}
          <Link className="border-b border-black/40 pb-0.5 hover:border-black" href="/login">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
