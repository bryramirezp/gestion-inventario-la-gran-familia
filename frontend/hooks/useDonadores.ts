// hooks/useDonadores.ts
'use client';
import { useState, useEffect } from 'react';
import { axiosClient } from '@/lib/axiosClient';

interface Donador {
  donador_id: string;
  nombre_completo: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  tipo_donador_id?: string;
  activo: boolean;
}

export function useDonadores() {
  const [donadores, setDonadores] = useState<Donador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonadores = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/donors', {
          withCredentials: true,
        });
        setDonadores(res.data || []);
      } catch (err) {
        console.error('Error fetching donadores:', err);
        setDonadores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDonadores();
  }, []);

  return { donadores, loading };
}
