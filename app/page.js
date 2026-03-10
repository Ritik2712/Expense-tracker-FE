'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user?.token) {
      router.replace('/dashboard');
      return;
    }
    router.replace('/login');
  }, [router]);

  return (
    <main className="shell">
      <p className="muted">Loading...</p>
    </main>
  );
}
