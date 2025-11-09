import React from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Label, Input, FormError } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { UserCircleIcon, KeyIcon } from '@/presentation/components/icons/Icons';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useForm } from '@/infrastructure/hooks/useForm';
import { userApi } from '@/data/api';
import { validatePassword } from '@/data/validation';
import { ROLES } from '@/shared/constants';

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

  const isAdministrator = userProfile?.role_name === ROLES.ADMINISTRADOR;

  const passwordForm = useForm<PasswordFormState>(
    { currentPassword: '', newPassword: '', confirmPassword: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.currentPassword)
        tempErrors.currentPassword = 'La contraseña actual es requerida.';
      if (!formData.newPassword) {
        tempErrors.newPassword = 'La nueva contraseña es requerida.';
      } else {
        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
          tempErrors.newPassword = passwordValidation.error || 'La contraseña no cumple con los requisitos.';
        }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start">
        {/* Profile Details Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="justify-center items-center !space-y-0 p-3 sm:p-4 md:p-6 overflow-hidden">
              <div className="w-full flex justify-center">
                <div className="px-3 py-3 sm:px-4 sm:py-3 md:px-5 md:py-4 bg-muted dark:bg-dark-muted rounded-2xl sm:rounded-3xl w-full max-w-full sm:max-w-sm flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold leading-tight text-foreground truncate">
                      {userProfile.full_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                      {userProfile.role_name}
                    </p>
                  </div>
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
                      placeholder="Mínimo 8 caracteres con dígitos, mayúsculas, minúsculas y símbolos"
                      required
                      error={!!passwordForm.errors.newPassword}
                      aria-describedby={passwordForm.errors.newPassword ? 'newPassword-error' : 'newPassword-help'}
                    />
                    <FormError message={passwordForm.errors.newPassword} id="newPassword-error" />
                    <p id="newPassword-help" className="text-xs text-muted-foreground mt-1">
                      La contraseña debe tener mínimo 8 caracteres e incluir: dígitos, letras minúsculas, letras mayúsculas y símbolos.
                    </p>
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
