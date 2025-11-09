import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { Button } from '@/presentation/components/ui/Button';
import { supabase } from '@/data/api';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { CheckCircleIcon, XCircleIcon } from '@/presentation/components/icons/Icons';
import { Label, Input, FormError } from '@/presentation/components/forms';

const ConfirmEmail: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ code?: string; description?: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState('');
  const [resending, setResending] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Primero verificar si hay errores en la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get('error') || queryParams.get('error');
        const errorCode = hashParams.get('error_code') || queryParams.get('error_code');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorDetails({ code: errorCode || undefined, description: errorDescription || undefined });
          
          // Mensajes específicos según el código de error
          if (errorCode === 'otp_expired') {
            setMessage('El enlace de confirmación ha expirado. Por favor, solicita un nuevo enlace.');
          } else if (errorCode === 'email_not_confirmed') {
            setMessage('No se pudo confirmar el correo electrónico. El enlace puede ser inválido.');
          } else {
            setMessage(errorDescription 
              ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
              : 'Ocurrió un error al confirmar tu correo electrónico.');
          }
          return;
        }

        // Si no hay errores, intentar confirmar el email
        // Supabase maneja automáticamente los tokens cuando están en la URL (hash fragments)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setMessage('Error al verificar la sesión. El enlace puede haber expirado.');
          return;
        }

        // Si hay una sesión, la confirmación fue exitosa
        if (session?.user) {
          setUserEmail(session.user.email || null);
          
          // Verificar si el email fue confirmado
          if (session.user.email_confirmed_at) {
            setStatus('success');
            setMessage('Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.');
          } else {
            // Esperar un momento y verificar de nuevo (puede tomar un momento en procesarse)
            setTimeout(async () => {
              const { data: { session: updatedSession } } = await supabase.auth.getSession();
              if (updatedSession?.user?.email_confirmed_at) {
                setStatus('success');
                setMessage('Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.');
              } else {
                setStatus('error');
                setMessage('No se pudo confirmar el correo electrónico. Verifica que el enlace sea válido.');
              }
            }, 2000);
          }
        } else {
          // No hay sesión, verificar si hay tokens en la URL
          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
          const type = hashParams.get('type') || queryParams.get('type');

          if (accessToken && refreshToken && type === 'signup') {
            // Intentar establecer la sesión manualmente
            const { data: authData, error: authError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!authError && authData.session?.user?.email_confirmed_at) {
              setUserEmail(authData.session.user.email || null);
              setStatus('success');
              setMessage('Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.');
            } else {
              // Esperar un momento y verificar de nuevo
              setTimeout(async () => {
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                if (retrySession?.user?.email_confirmed_at) {
                  setUserEmail(retrySession.user.email || null);
                  setStatus('success');
                  setMessage('Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.');
                } else {
                  setStatus('error');
                  setMessage('El enlace de confirmación puede haber expirado. Por favor, solicita un nuevo enlace de confirmación.');
                }
              }, 1000);
            }
          } else {
            setStatus('error');
            setMessage('Enlace de confirmación inválido o expirado. Por favor, solicita un nuevo enlace de confirmación.');
          }
        }
      } catch (error) {
        console.error('Error durante confirmación de email:', error);
        setStatus('error');
        setMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    };

    handleEmailConfirmation();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setUserEmail(session.user.email || null);
        setStatus('success');
        setMessage('Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResendConfirmation = async (emailToUse?: string) => {
    const email = emailToUse || userEmail || resendEmail;
    
    if (!email) {
      setResendError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResendError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setResending(true);
    setResendError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/ConfirmEmail`,
        },
      });

      if (error) {
        setResendError(`Error al reenviar el correo: ${error.message}`);
        setMessage(`Error al reenviar el correo: ${error.message}`);
      } else {
        setMessage('Se ha enviado un nuevo correo de confirmación. Por favor, revisa tu bandeja de entrada.');
        setResendEmail('');
        setShowResendForm(false);
      }
    } catch (error) {
      console.error('Error al reenviar confirmación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al reenviar el correo de confirmación.';
      setResendError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <LoadingSpinner size="lg" message="Confirmando tu correo electrónico..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground flex items-center justify-center p-4">
      <AnimatedWrapper>
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === 'success' ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircleIcon className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-2xl">¡Cuenta creada exitosamente!</CardTitle>
                <CardDescription className="mt-2">{message}</CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircleIcon className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Error de confirmación</CardTitle>
                <CardDescription className="mt-2">{message}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'success' ? (
              <div className="space-y-3">
                <Button as={Link} to="/login" size="lg" className="w-full">
                  Ir al Login
                </Button>
                <Button as={Link} to="/landing" variant="ghost" className="w-full">
                  Volver al Inicio
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!showResendForm && !userEmail ? (
                  <Button 
                    onClick={() => setShowResendForm(true)} 
                    size="lg" 
                    className="w-full"
                  >
                    Solicitar nuevo correo de confirmación
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {!userEmail && (
                      <div className="space-y-2">
                        <Label htmlFor="resend-email">
                          Correo electrónico
                        </Label>
                        <Input
                          id="resend-email"
                          type="email"
                          value={resendEmail}
                          onChange={(e) => {
                            setResendEmail(e.target.value);
                            setResendError('');
                          }}
                          placeholder="tu@email.com"
                          error={!!resendError}
                          disabled={resending}
                        />
                        <FormError message={resendError} />
                      </div>
                    )}
                    <Button 
                      onClick={() => handleResendConfirmation()} 
                      size="lg" 
                      className="w-full"
                      disabled={resending || (!userEmail && !resendEmail)}
                    >
                      {resending ? 'Enviando...' : 'Reenviar correo de confirmación'}
                    </Button>
                    {showResendForm && (
                      <Button 
                        onClick={() => {
                          setShowResendForm(false);
                          setResendEmail('');
                          setResendError('');
                        }} 
                        variant="ghost" 
                        className="w-full"
                        disabled={resending}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                )}
                {userEmail && !showResendForm && (
                  <Button 
                    onClick={() => handleResendConfirmation()} 
                    size="lg" 
                    className="w-full"
                    disabled={resending}
                  >
                    {resending ? 'Enviando...' : 'Reenviar correo de confirmación'}
                  </Button>
                )}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button as={Link} to="/login" variant="outline" className="w-full">
                    Ir al Login
                  </Button>
                  <Button as={Link} to="/landing" variant="ghost" className="w-full">
                    Volver al Inicio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
};

export default ConfirmEmail;