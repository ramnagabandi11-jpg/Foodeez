'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

export default function AdminDashboardPage() {
  const { isAuthenticated, checkAuth, hasPermission } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login');
    } else if (!hasPermission('super_admin')) {
      router.push('/unauthorized');
    }
  }, [checkAuth, hasPermission, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="admin-main flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <DashboardOverview />
        </main>
      </div>
    </div>
  );
}