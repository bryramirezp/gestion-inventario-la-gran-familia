// frontend/hooks/useMovements.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from './AuthProvider';

export interface Movement {
  id: number;
  source: 'inventario' | 'almacenes';
  type: string; // 'entrada'|'salida'|'ajuste'|'transfer'
  productId: number;
  productName?: string | null;
  quantity: number;
  date: string;
  reason?: string;
  fromWarehouseId?: number | null;
  fromWarehouseName?: string | null;
  toWarehouseId?: number | null;
  toWarehouseName?: string | null;
  userId?: number | null;
  raw?: any;
}

export const useMovements = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // esperamos a que auth termine
    if (!user) {
      setMovements([]);
      setLoading(false);
      return;
    }

    const fetchMovements = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/movements', {
          credentials: 'include',
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Error fetching movements');
        }
        const data = await res.json();
        setMovements(data || []);
      } catch (err: any) {
        console.error('useMovements error:', err);
        setError(err.message || 'Error cargando movimientos');
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [user, authLoading]);

  return { movements, loading, error };
};
