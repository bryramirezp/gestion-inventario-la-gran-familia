import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Label, Input, FormError } from '@/presentation/components/forms';
import { KeyIcon, EyeIcon, EyeSlashIcon } from '@/presentation/components/icons/Icons';
import { useForm } from '@/infrastructure/hooks/useForm';
import { supabase } from '@/data/api';
import { validatePassword } from '@/data/validation';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { ROUTES } from '@/shared/constants';

const UpdatePassword: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { addAlert } = useAlerts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { values, errors, handleChange, handleSubmit, setErrors } = useForm(
    { newPassword: '', confirmPassword: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.newPassword) {
        tempErrors.newPassword = 'La nueva contraseña es requerida.';
      } else {
        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
          tempErrors.newPassword = passwordValidation.error || 'La contraseña no cumple con los requisitos.';
        }
      }
      if (formData.newPassword !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Las contraseñas no coinciden.';
      }
      return tempErrors;
    }
  );

  useEffect(() => {
    let mounted = true;
    
    // Escuchar cambios en el estado de autenticación ANTES de verificar la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery event detected');
        if (mounted) {
          setIsInitializing(false);
        }
      } else if (event === 'SIGNED_IN' && session) {
        console.log('Signed in event detected');
        if (mounted) {
          setIsInitializing(false);
        }
      }
    });
    
    const initializeSession = async () => {
      if (!authLoading) {
        setIsInitializing(true);
        
        // Verificar si hay tokens en la URL (fragment o query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type') || searchParams.get('type');
        
        console.log('URL type:', type);
        console.log('Hash params:', window.location.hash);
        console.log('Search params:', window.location.search);
        
        // Si hay un tipo de recovery, Supabase debería procesar los tokens automáticamente
        // Esperar un momento para que Supabase procese los tokens de la URL
        if (type === 'recovery' || window.location.hash.includes('access_token')) {
          console.log('Recovery tokens detected, waiting for Supabase to process...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Verificar la sesión
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session check:', { hasSession: !!session, error, userEmail: session?.user?.email });
        
        if (error) {
          console.error('Error al obtener sesión:', error);
          if (mounted) {
            addAlert('Error al verificar la sesión. Por favor, intenta de nuevo.', 'error');
            setIsInitializing(false);
            // No redirigir inmediatamente, dar tiempo para que el evento se dispare
            setTimeout(async () => {
              if (mounted) {
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                if (!retrySession) {
                  navigate(ROUTES.FORGOT_PASSWORD);
                }
              }
            }, 2000);
          }
          return;
        }
        
        if (!session) {
          console.warn('No session found');
          if (mounted) {
            // Esperar un poco más por si Supabase aún está procesando
            setTimeout(async () => {
              if (!mounted) return;
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (!retrySession) {
                addAlert('El enlace de restablecimiento ha expirado o es inválido. Por favor, solicita un nuevo enlace.', 'error');
                setIsInitializing(false);
                navigate(ROUTES.FORGOT_PASSWORD);
              } else {
                setIsInitializing(false);
              }
            }, 2000);
          }
          return;
        }
        
        if (mounted) {
          console.log('Session established successfully');
          setIsInitializing(false);
        }
      }
    };
    
    initializeSession();
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authLoading, navigate, addAlert, searchParams]);

  const handleUpdatePassword = async () => {
    setIsUpdating(true);
    try {
      // Verificar que tenemos una sesión antes de actualizar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Updating password with session:', { hasSession: !!session, userEmail: session?.user?.email });
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Error de sesión: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('No session available for password update');
        throw new Error('No hay una sesión válida. Por favor, solicita un nuevo enlace de restablecimiento.');
      }
      
      // Actualizar la contraseña
      console.log('Calling updateUser...');
      const { data, error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      console.log('Update user response:', { data, error });

      if (error) {
        console.error('Update password error:', error);
        throw error;
      }

      console.log('Password updated successfully');
      addAlert('¡Contraseña actualizada con éxito!', 'success');
      
      // Esperar un momento antes de redirigir para asegurar que la sesión esté actualizada
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1000);
    } catch (err: any) {
      console.error('Error al actualizar contraseña:', err);
      const errorMessage = err.message || 'Error al actualizar la contraseña. Por favor, inténtalo de nuevo.';
      setErrors({
        form: errorMessage
      });
      addAlert(errorMessage, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-dark-background">
        <LoadingSpinner size="lg" message="Verificando enlace de recuperación..." />
      </div>
    );
  }

  // No requerir user del contexto, solo verificar sesión directamente
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-dark-background">
        <Card className="w-full max-w-sm shadow-medium">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              El enlace de restablecimiento ha expirado o es inválido. Por favor, solicita un nuevo enlace.
            </p>
            <Button 
              as="a" 
              href={ROUTES.FORGOT_PASSWORD} 
              variant="outline" 
              className="w-full mt-4"
            >
              Solicitar Nuevo Enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-dark-background">
      <Card className="w-full max-w-sm shadow-medium">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center mb-4">
            <div className="bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center p-2">
              <KeyIcon className="h-8 w-8" />
            </div>
          </div>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, handleUpdatePassword)} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.newPassword}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres con dígitos, mayúsculas, minúsculas y símbolos"
                  required
                  aria-invalid={!!errors.newPassword}
                  aria-describedby={errors.newPassword ? 'newPassword-error' : 'newPassword-help'}
                  error={!!errors.newPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNewPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p id="newPassword-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.newPassword}
                </p>
              )}
              <p id="newPassword-help" className="text-xs text-muted-foreground mt-1">
                La contraseña debe tener mínimo 8 caracteres e incluir: dígitos, letras minúsculas, letras mayúsculas y símbolos.
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma la contraseña"
                  required
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  error={!!errors.confirmPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            {errors.form && (
              <p className="text-sm text-destructive text-center" role="alert" aria-live="polite">
                {errors.form}
              </p>
            )}
            <Button 
              type="submit" 
              disabled={!values.newPassword || !values.confirmPassword || isUpdating} 
              loading={isUpdating}
              loadingText="Actualizando contraseña..."
              className="w-full"
            >
              {!isUpdating && <KeyIcon className="w-4 h-4 mr-2" />}
              Actualizar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;

