'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { authResolved, isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authResolved) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [authResolved, isAuthenticated, router]);

  if (!authResolved || !ready) {
    return <p className="p-6">Checking auth...</p>;
  }

  return children;
}
