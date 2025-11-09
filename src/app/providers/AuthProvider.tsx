// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from '@/data/api';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: { message: string } | null }>;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    navigate('/landing');
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    // Crear usuario en Supabase Auth
    // Supabase enviará automáticamente un email de confirmación si:
    // 1. Email confirmation está habilitado en el proyecto de Supabase
    // 2. La URL de redirección está registrada en Authentication > URL Configuration > Redirect URLs
    // 3. El servicio de email está configurado (SMTP o servicio interno de Supabase)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // URL a la que Supabase redirigirá después de que el usuario haga clic en el enlace del email
        // Esta URL debe estar registrada en el dashboard de Supabase: 
        // Authentication > URL Configuration > Redirect URLs
        emailRedirectTo: `${window.location.origin}/ConfirmEmail`,
      },
    });

    if (error) {
      console.error('Error en signup:', error.message);
    } else {
      // Nota: Supabase enviará el email automáticamente si está configurado
      // El email se envía incluso cuando un admin crea el usuario
      console.log('Usuario creado. Correo de confirmación enviado a:', email);
    }

    return { user: data.user, error };
  };

  const getToken = () => session?.access_token || null;

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    signUp,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};