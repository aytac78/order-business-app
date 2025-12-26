'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, roleConfig } from '@/stores/authStore';
import { SingleVenueDashboard } from '@/components/dashboard/SingleVenueDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { currentStaff, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !currentStaff) {
      router.push('/');
    }
  }, [isAuthenticated, currentStaff, router]);

  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return <SingleVenueDashboard />;
}
