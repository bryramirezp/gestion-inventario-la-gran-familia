'use client';

import { useAuthContext } from '@/hooks/AuthProvider';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { PageLoading } from '@/components/ui/loading';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuthContext(); // <-- aquí usamos "loading"

  if (loading) {
    return <PageLoading message="Cargando sistema..." />;
  }

  if (!user) {
    return null; // Middleware o redirección de login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 md:ml-0 overflow-auto">
        <div className="md:p-8 p-4 pt-16 md:pt-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs />
          </div>

          {/* Page Content */}
          <div className="transition-all duration-200 ease-in-out">
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
