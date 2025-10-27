import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import ManagerView from './kitchen/ManagerView';
import KitchenStaffView from './kitchen/KitchenStaffView';
import NutritionistView from './kitchen/NutritionistView';

const Kitchen: React.FC = () => {
  const { user, loading } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  if (loading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full">Cargando Módulo de Cocina...</div>
    );
  }

  if (!user || !userProfile) {
    return <div className="flex items-center justify-center h-full">Usuario no encontrado.</div>;
  }

  switch (userProfile.role_name) {
    case 'Kitchen Staff':
      return <KitchenStaffView />;
    case 'Nutritionist':
      return <NutritionistView />;
    case 'Administrator':
    case 'Warehouse Manager':
      return <ManagerView />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          No tienes acceso a este módulo.
        </div>
      );
  }
};

export default Kitchen;
