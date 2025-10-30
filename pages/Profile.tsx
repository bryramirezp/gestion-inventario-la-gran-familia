import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Label, Input, FormError } from '../components/forms';
import { Button } from '../components/Button';
import { AnimatedWrapper } from '../components/Animated';
import { UserCircleIcon, KeyIcon } from '../components/icons/Icons';
import { useAlerts } from '../contexts/AlertContext';
import { useForm } from '../hooks/useForm';
import { userApi } from '../services/api';

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileFormState {
  full_name: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { addAlert } = useAlerts();

  const isAdministrator = userProfile?.role_name === 'Administrador';

  const passwordForm = useForm<PasswordFormState>(
    { currentPassword: '', newPassword: '', confirmPassword: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.currentPassword)
        tempErrors.currentPassword = 'La contraseña actual es requerida.';
      if (!formData.newPassword) {
        tempErrors.newPassword = 'La nueva contraseña es requerida.';
      } else if (formData.newPassword.length < 6) {
        tempErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres.';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Las nuevas contraseñas no coinciden.';
      }
      return tempErrors;
    }
  );

  const profileForm = useForm<ProfileFormState>(
    { full_name: userProfile?.full_name || '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.full_name) tempErrors.full_name = 'El nombre completo es requerido.';
      return tempErrors;
    }
  );

  if (!user || !userProfile) {
    return null;
  }

  const handleProfileUpdate = async () => {
    try {
      await userApi.updateProfile('', userProfile.user_id, { full_name: profileForm.values.full_name });
      addAlert('¡Perfil actualizado con éxito!', 'success');
    } catch (error: any) {
      addAlert(`Error: ${error.message}`, 'error');
      profileForm.setErrors({ form: error.message });
    }
  };

  const handlePasswordSubmit = () => {
    // This is a simulated action. In a real app, you would call an API endpoint.
    // Simulando cambio de contraseña para usuario
    addAlert('¡Contraseña cambiada con éxito! (Simulado)', 'success');
    passwordForm.reset();
  };

  return (
    <AnimatedWrapper>
      <Header
        title="Perfil de Usuario"
        description="Ve los detalles de tu perfil y administra tu cuenta."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Details Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-muted dark:bg-dark-muted rounded-full mb-4 flex items-center">
                <UserCircleIcon className="h-16 w-16 text-primary" />
                <div className="ml-3 flex flex-col">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {userProfile.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{userProfile.role_name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2 text-sm text-foreground">Permisos</h4>
              <p className="text-sm text-muted-foreground">
                Tienes acceso para administrar el inventario y las operaciones según tu rol como{' '}
                {userProfile.role_name}.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información de Perfil</CardTitle>
              <CardDescription>Actualiza tus detalles personales aquí.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => profileForm.handleSubmit(e, handleProfileUpdate)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={profileForm.values.full_name}
                    onChange={profileForm.handleChange}
                    required
                    disabled={!isAdministrator}
                    error={!!profileForm.errors.full_name}
                  />
                  {!isAdministrator && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo los administradores pueden cambiar tu nombre completo.
                    </p>
                  )}
                  <FormError message={profileForm.errors.full_name} />
                </div>
                <div>
                  <Label htmlFor="role_name">Rol</Label>
                  <Input id="role_name" name="role_name" value={userProfile.role_name} disabled />
                </div>
                <FormError message={profileForm.errors.form} />
                {isAdministrator && (
                  <div className="flex justify-end">
                    <Button type="submit">Guardar Cambios</Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {isAdministrator && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyIcon className="h-5 w-5 mr-2" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                  Usa este formulario para cambiar tu propia contraseña. Nota: Esta función es para
                  fines de demostración.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => passwordForm.handleSubmit(e, handlePasswordSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.values.currentPassword}
                      onChange={passwordForm.handleChange}
                      required
                      error={!!passwordForm.errors.currentPassword}
                    />
                    <FormError message={passwordForm.errors.currentPassword} />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.values.newPassword}
                      onChange={passwordForm.handleChange}
                      required
                      error={!!passwordForm.errors.newPassword}
                    />
                    <FormError message={passwordForm.errors.newPassword} />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.values.confirmPassword}
                      onChange={passwordForm.handleChange}
                      required
                      error={!!passwordForm.errors.confirmPassword}
                    />
                    <FormError message={passwordForm.errors.confirmPassword} />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Actualizar Contraseña</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
};

export default Profile;
