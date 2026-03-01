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

  return <p className="p-6">Loading...</p>;
}
