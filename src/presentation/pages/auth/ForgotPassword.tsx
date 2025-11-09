import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Label, Input, FormError } from '@/presentation/components/forms';
import { KeyIcon, MailIcon } from '@/presentation/components/icons/Icons';
import { useForm } from '@/infrastructure/hooks/useForm';
import { isValidEmail } from '@/data/validation';
import { supabase } from '@/data/api';
import { useAlerts } from '@/app/providers/AlertProvider';
import { ROUTES } from '@/shared/constants';

const ForgotPassword: React.FC = () => {
  const { addAlert } = useAlerts();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { values, errors, handleChange, handleSubmit, setErrors } = useForm(
    { email: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.email) {
        tempErrors.email = 'El correo electrónico es requerido.';
      } else if (!isValidEmail(formData.email)) {
        tempErrors.email = 'Por favor, ingresa un correo electrónico válido.';
      }
      return tempErrors;
    }
  );

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      addAlert('Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.', 'success');
    } catch (err: any) {
      setErrors({
        form: err.message || 'Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.'
      });
      addAlert(err.message || 'Error al enviar el correo de restablecimiento.', 'error');
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-dark-background">
        <Card className="w-full max-w-sm shadow-medium">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <MailIcon className="h-8 w-8" />
            </div>
            <CardTitle>Correo Enviado</CardTitle>
            <CardDescription>
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Si no recibes el correo en unos minutos, revisa tu carpeta de spam o intenta de nuevo.
              </p>
              <Button as={Link} to={ROUTES.LOGIN} variant="outline" className="w-full">
                Volver al Login
              </Button>
            </div>
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
          <CardTitle>Restablecer Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, handleResetPassword)} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                placeholder="usuario@ejemplo.com"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                error={!!errors.email}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
            {errors.form && (
              <p className="text-sm text-destructive text-center" role="alert" aria-live="polite">
                {errors.form}
              </p>
            )}
            <Button type="submit" disabled={!values.email} className="w-full">
              <MailIcon className="w-4 h-4 mr-2" />
              Enviar Enlace de Restablecimiento
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button as={Link} to={ROUTES.LOGIN} variant="link" className="text-sm">
              &laquo; Volver al Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

