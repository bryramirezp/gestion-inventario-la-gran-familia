// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/AuthProvider'; // <-- importar AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema de Inventario - La Gran Familia',
  description: 'Sistema integral de gestión de inventario para la fundación La Gran Familia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children} {/* Ahora todos los hijos tienen acceso a useAuthContext */}
        </AuthProvider>
      </body>
    </html>
  );
}
