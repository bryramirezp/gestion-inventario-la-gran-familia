import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Label, Input } from '@/presentation/components/forms';
import { KeyIcon, EyeIcon, EyeSlashIcon } from '@/presentation/components/icons/Icons';
import { ResponsiveImage } from '@/presentation/components/ui/ResponsiveImage';
import { useForm } from '@/infrastructure/hooks/useForm';
import { isValidEmail } from '@/data/validation';
import { ROUTES } from '@/shared/constants';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleSubmit, setErrors } = useForm(
    { email: '', password: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.email) tempErrors.email = 'El correo electrónico es requerido.';
      else if (!isValidEmail(formData.email)) {
        tempErrors.email = 'Por favor, ingresa un correo electrónico válido.';
      }
      if (!formData.password) tempErrors.password = 'La contraseña es requerida.';
      return tempErrors;
    }
  );

  useEffect(() => {
    // Solo redirigir cuando tengamos usuario Y no estemos cargando
    if (user && !authLoading) {
      // Usuario autenticado, redirigiendo al dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async () => {
    setErrors({});
    try {
      // Iniciando proceso de login
      await login(values.email, values.password);
      // Proceso de login completado
      // NO forzar redirección - dejar que useEffect lo maneje cuando user cambie
    } catch (err: any) {
      setErrors({
        form: err.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
      });
      // Error en login - manejado por el sistema de alertas
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--hero-gradient-start),_var(--hero-gradient-end))]">
      <Card className="w-full max-w-sm shadow-medium">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center mb-4">
            <ResponsiveImage
              src="/logo-lagranfamilia.png"
              alt="La Gran Familia"
              className="w-16 h-16 object-contain"
              loading="eager"
              width={64}
              height={64}
              sizes="64px"
            />
          </div>
          <CardTitle>Gestión de Inventario</CardTitle>
          <CardDescription>Ingresa tu correo electrónico y contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, handleLogin)} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                placeholder="Ingresa tu correo electrónico"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.password}
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
              disabled={!values.email} 
              loading={authLoading}
              loadingText="Iniciando sesión..."
              className="w-full"
            >
              {!authLoading && <KeyIcon className="w-4 h-4 mr-2" />}
              Iniciar Sesión
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            <div className="bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/40 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 text-center">
                Credenciales de prueba
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Correo:</span>
                  <p className="font-mono text-foreground mt-0.5">user@example.com</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contraseña:</span>
                  <p className="font-mono text-foreground mt-0.5">Usuario123.</p>
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <Button as={Link} to={ROUTES.FORGOT_PASSWORD} variant="link" className="text-sm">
                ¿Olvidaste tu contraseña?
              </Button>
              <Button as={Link} to="/landing" variant="link" className="text-sm">
                &laquo; Volver a la Página Principal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
