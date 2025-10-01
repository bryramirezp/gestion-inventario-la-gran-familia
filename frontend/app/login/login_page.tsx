'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/AuthProvider'; // <-- usa el contexto
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthContext(); // <-- usamos login del contexto
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password); // <-- autenticación via AuthProvider
      router.push('/dashboard'); // redirige al dashboard si todo va bien
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-foundation-cream via-foundation-yellow-light to-foundation-gold flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-foundation-orange to-foundation-gold rounded-full flex items-center justify-center shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-foundation-brown">
            Sistema de Inventario
          </CardTitle>
          <CardDescription className="text-foundation-bronze">
            La Gran Familia - Control de Almacenes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foundation-brown font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@fundacion.org"
                required
                className="border-foundation-bronze/30 focus:border-foundation-orange focus:ring-foundation-orange/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foundation-brown font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-foundation-bronze/30 focus:border-foundation-orange focus:ring-foundation-orange/20"
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90 text-white font-medium py-3 shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-foundation-cream/50 rounded-lg">
            <p className="text-sm font-medium text-foundation-brown mb-2">Usuarios de prueba:</p>
            <div className="text-xs text-foundation-bronze space-y-1">
              <p>
                <strong>Admin:</strong> lorena@fundacion.org / admin123
              </p>
              <p>
                <strong>Admin:</strong> lilith@fundacion.org / admin123
              </p>
              <p>
                <strong>Empleado:</strong> empleado@fundacion.org / admin123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
