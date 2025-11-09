import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from '@/presentation/components/layout/Sidebar';
import { NotificationProvider } from '@/app/providers/NotificationProvider';
import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import Login from '@/presentation/pages/auth/Login';
import Landing from '@/presentation/pages/landing/Landing';
import ConfirmEmail from '@/presentation/pages/auth/ConfirmEmail';
import ForgotPassword from '@/presentation/pages/auth/ForgotPassword';
import UpdatePassword from '@/presentation/pages/auth/UpdatePassword';
import { AlertProvider } from '@/app/providers/AlertProvider';
import { AlertContainer } from '@/presentation/components/ui/Alerts';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import TopBar from '@/presentation/components/layout/TopBar';
import { QueryProvider } from '@/app/providers/QueryProvider';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { ROUTES, ROLE_PERMISSIONS } from '@/shared/constants';

// Lazy load all page components
const Dashboard = React.lazy(() => import('@/presentation/pages/dashboard/Dashboard'));
const Products = React.lazy(() => import('@/presentation/pages/products/Products'));
const Warehouses = React.lazy(() => import('@/presentation/pages/warehouses/Warehouses'));
const Categories = React.lazy(() => import('@/presentation/pages/categories/Categories'));
const Brands = React.lazy(() => import('@/presentation/pages/brands/Brands'));
const Donors = React.lazy(() => import('@/presentation/pages/donors/Donors'));
const Donations = React.lazy(() => import('@/presentation/pages/donations/Donations'));
const Users = React.lazy(() => import('@/presentation/pages/users/Users'));
const WarehouseDetail = React.lazy(() => import('@/presentation/pages/warehouses/WarehouseDetail'));
const Profile = React.lazy(() => import('@/presentation/pages/profile/Profile'));
const ExpiryReport = React.lazy(() => import('@/presentation/pages/reports/ExpiryReport'));
const DonorAnalysis = React.lazy(() => import('@/presentation/pages/donors/DonorAnalysis'));
const Backup = React.lazy(() => import('@/presentation/pages/backup/Backup'));
const DonorDetail = React.lazy(() => import('@/presentation/pages/donors/DonorDetail'));

const MainLayout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground min-h-screen">
            <Sidebar isCollapsed={isSidebarCollapsed} isMobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />
            <div 
                className={`flex flex-col min-w-0 w-full transition-all duration-500 ease-in-out ${
                    isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
                }`}
            >
                <TopBar 
                    onMobileMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                    isSidebarCollapsed={isSidebarCollapsed} 
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    isMobileMenuOpen={isMobileMenuOpen}
                />
                <main className="flex-1 p-page sm:p-6 lg:p-8 overflow-y-auto min-h-0 w-full">
                    <div className="max-w-full mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

const ProtectedRoute: React.FC<{ roles?: string[] }> = ({ roles }) => {
    const { user, loading } = useAuth();
    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(); // Use useUserProfile

    if (loading || isProfileLoading) { // Wait for both auth and profile to load
        return <LoadingSpinner size="lg" message="Cargando..." centerScreen />;
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (roles && (!userProfile || !roles.includes(userProfile.role_name))) { // Use userProfile.role_name
        // Redirect to a default page if user doesn't have the required role
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <Outlet />;
};



const LoadingFallback: React.FC = () => (
  <LoadingSpinner size="lg" message="Cargando aplicación..." centerScreen />
);

const App: React.FC = () => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
              <NotificationProvider>
                  <AlertProvider>
                      <AlertContainer />
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path={ROUTES.LANDING} element={<Landing />} />
                            <Route path={ROUTES.LOGIN} element={<Login />} />
                            <Route path={ROUTES.CONFIRM_EMAIL} element={<ConfirmEmail />} />
                            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
                            <Route path={ROUTES.UPDATE_PASSWORD} element={<UpdatePassword />} />

                            <Route element={<ProtectedRoute />}>
                                <Route element={<MainLayout />}>
                                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                                    <Route path={ROUTES.PROFILE} element={<Profile />} />

                                    {/* Routes accessible by Administrador and Operador */}
                                    <Route element={<ProtectedRoute roles={ROLE_PERMISSIONS.INVENTORY_ACCESS} />}>
                                        <Route path={ROUTES.PRODUCTS} element={<Products />} />
                                        <Route path={ROUTES.DONATIONS} element={<Donations />} />
                                        <Route path={ROUTES.DONORS} element={<Donors />} />
                                        <Route path={ROUTES.DONOR_DETAIL} element={<DonorDetail />} />
                                        <Route path={ROUTES.WAREHOUSE_DETAIL} element={<WarehouseDetail />} />
                                        <Route path={ROUTES.WAREHOUSES} element={<Warehouses />} />
                                        <Route path={ROUTES.EXPIRY_REPORT} element={<ExpiryReport />} />
                                        <Route path={ROUTES.DONOR_ANALYSIS} element={<DonorAnalysis />} />
                                    </Route>

                                    {/* Routes accessible only by Administrador */}
                                    <Route element={<ProtectedRoute roles={ROLE_PERMISSIONS.ADMIN_ACCESS} />}>
                                        <Route path={ROUTES.CATEGORIES} element={<Categories />} />
                                        <Route path={ROUTES.BRANDS} element={<Brands />} />
                                        <Route path={ROUTES.USERS} element={<Users />} />
                                    </Route>

                                    {/* Backup route for specific admins */}
                                    <Route element={<ProtectedRoute roles={ROLE_PERMISSIONS.ADMIN_ACCESS} />}>
                                        <Route path={ROUTES.BACKUP} element={<Backup />} />
                                    </Route>
                                </Route>
                            </Route>

                            <Route path="/" element={<Navigate to={ROUTES.LANDING} replace />} />

                        </Routes>
                      </Suspense>
                  </AlertProvider>
              </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default App;