'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { setStoredUser } from '@/lib/auth';

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth', form);
      setStoredUser(res.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel w-full max-w-md">
      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-black/60">Expense Tracker</p>
      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-black">Register User</h1>
      <p className="mb-6 text-sm text-black/60">Create a regular user account.</p>

      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="field"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <button disabled={loading} className="btn-primary w-full" type="submit">
          {loading ? 'Creating...' : 'Create User'}
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
  );
}
