import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import LoadingSpinner from '../components/LoadingSpinner';
import ManagerView from './kitchen/ManagerView';
import KitchenStaffView from './kitchen/KitchenStaffView';

const Kitchen: React.FC = () => {
  const { user, loading } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  if (loading || isProfileLoading) {
    return <LoadingSpinner size="lg" message="Cargando Módulo de Cocina..." centerScreen />;
  }

  if (!user || !userProfile) {
    return <LoadingSpinner size="lg" message="Usuario no encontrado." centerScreen />;
  }

  switch (userProfile.role_name) {
    case 'Administrador':
      return <ManagerView />;
    case 'Operador':
      return <ManagerView />;
    case 'Consultor':
      return <KitchenStaffView />;
    default:
      return <LoadingSpinner size="lg" message="No tienes acceso a este módulo." centerScreen />;
  }
};

export default Kitchen;

