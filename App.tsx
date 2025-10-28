import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from './components/Sidebar';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUserProfile } from './hooks/useUserProfile'; // Import useUserProfile
import Login from './pages/Login';
import Landing from './pages/Landing';
import { AlertProvider } from './contexts/AlertContext';
import { AlertContainer } from './components/Alerts';
import { ThemeProvider } from './contexts/ThemeContext';
import TopBar from './components/TopBar';
import { QueryProvider } from './contexts/QueryProvider';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load all page components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Products = React.lazy(() => import('./pages/Products'));
const Warehouses = React.lazy(() => import('./pages/Warehouses'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Brands = React.lazy(() => import('./pages/Brands'));
const Donors = React.lazy(() => import('./pages/Donors'));
const Donations = React.lazy(() => import('./pages/Donations'));
const Kitchen = React.lazy(() => import('./pages/Kitchen'));
const Users = React.lazy(() => import('./pages/Users'));
const WarehouseDetail = React.lazy(() => import('./pages/WarehouseDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ExpiryReport = React.lazy(() => import('./pages/ExpiryReport'));
const DonorAnalysis = React.lazy(() => import('./pages/DonorAnalysis'));
const Backup = React.lazy(() => import('./pages/Backup'));
const DonorDetail = React.lazy(() => import('./pages/DonorDetail'));

const MainLayout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="flex bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground min-h-screen">
            <Sidebar isCollapsed={isSidebarCollapsed} isMobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar onMobileMenuClick={() => setIsMobileMenuOpen(true)} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-full mx-auto h-full">
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
        return <LoadingSpinner size="lg" message="Cargando..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && (!userProfile || !roles.includes(userProfile.role_name))) { // Use userProfile.role_name
        // Redirect to a default page if user doesn't have the required role
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

const AdminOnlyRoute: React.FC = () => {
    const { user, loading } = useAuth();
    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(); // Use useUserProfile

    if (loading || isProfileLoading) { // Wait for both auth and profile to load
        return <LoadingSpinner size="lg" message="Cargando..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!userProfile || userProfile.role_name !== 'Administrator') { // Check role instead of hardcoded IDs
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};


const LoadingFallback: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" message="Cargando aplicación..." />
    </div>
  </div>
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
                            <Route path="/landing" element={<Landing />} />
                            <Route path="/login" element={<Login />} />

                            <Route element={<ProtectedRoute />}>
                                <Route element={<MainLayout />}>
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/profile" element={<Profile />} />

                                    {/* Routes accessible by Administrator and Warehouse Manager */}
                                    <Route element={<ProtectedRoute roles={['Administrator', 'Warehouse Manager']} />}>
                                        <Route path="/products" element={<Products />} />
                                        <Route path="/donations" element={<Donations />} />
                                        <Route path="/donors" element={<Donors />} />
                                        <Route path="/donors/:id" element={<DonorDetail />} />
                                        <Route path="/warehouses/:id" element={<WarehouseDetail />} />
                                        <Route path="/warehouses" element={<Warehouses />} />
                                        <Route path="/expiry-report" element={<ExpiryReport />} />
                                        <Route path="/donor-analysis" element={<DonorAnalysis />} />
                                    </Route>

                                    {/* Routes accessible only by Administrator */}
                                    <Route element={<ProtectedRoute roles={['Administrator']} />}>
                                        <Route path="/categories" element={<Categories />} />
                                        <Route path="/brands" element={<Brands />} />
                                        <Route path="/users" element={<Users />} />
                                    </Route>

                                    {/* Kitchen route accessible by multiple specific roles */}
                                    <Route element={<ProtectedRoute roles={['Administrator', 'Warehouse Manager', 'Kitchen Staff', 'Nutritionist']} />}>
                                        <Route path="/kitchen" element={<Kitchen />} />
                                    </Route>

                                    {/* Backup route for specific admins */}
                                    <Route element={<AdminOnlyRoute />}>
                                        <Route path="/backup" element={<Backup />} />
                                    </Route>
                                </Route>
                            </Route>

                            <Route path="/" element={<Navigate to="/landing" replace />} />

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