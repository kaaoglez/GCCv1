'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminStore } from '@/lib/admin-store';
import { AdminPanel } from './AdminPanel';

export function AdminGate() {
  const { isAdmin } = useAdminStore();
  const searchParams = useSearchParams();
  const showAdmin = searchParams.get('admin') === '1' || isAdmin;
  const prevDarkClass = useRef<boolean | null>(null);

  // Remove 'dark' class so no dark mode styles apply in admin
  useEffect(() => {
    if (!showAdmin) return;

    const html = document.documentElement;
    prevDarkClass.current = html.classList.contains('dark');

    if (prevDarkClass.current) {
      html.classList.remove('dark');
    }

    return () => {
      if (prevDarkClass.current) {
        html.classList.add('dark');
      }
      prevDarkClass.current = null;
    };
  }, [showAdmin]);

  if (!showAdmin) return null;

  return (
    <div style={{ backgroundColor: '#FAFAF7' }} className="min-h-screen">
      <AdminPanel />
    </div>
  );
}
