import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatedWrapper } from '../components/Animated';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the tokens from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const email = searchParams.get('email');

        if (type === 'signup' && token) {
          // Verify the email confirmation token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
            email: email || undefined,
          });

          if (error) {
            // Error verificando email - manejado por el sistema
            setStatus('error');
            setMessage('Error al confirmar el correo electrónico. El enlace puede haber expirado.');
          } else if (data.user) {
            setStatus('success');
            setMessage('Tu correo electrónico ha sido confirmado exitosamente.');
          } else {
            setStatus('error');
            setMessage('No se pudo confirmar el correo electrónico. Inténtalo de nuevo.');
          }
        } else {
          setStatus('error');
          setMessage('Enlace de confirmación inválido o expirado.');
        }
      } catch (error) {
        // Error durante confirmación de email - manejado por el sistema
        setStatus('error');
        setMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" message="Confirmando tu correo electrónico..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground flex items-center justify-center">
      <AnimatedWrapper>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {status === 'success' ? 'Confirmado' : 'Error'}
          </h1>
          <p className="text-lg text-muted-foreground dark:text-dark-muted-foreground mb-8">
            {message}
          </p>
          <Button as={Link} to="/landing" size="lg">
            Ir al Portal
          </Button>
        </div>
      </AnimatedWrapper>
    </div>
  );
};

export default ConfirmEmail;