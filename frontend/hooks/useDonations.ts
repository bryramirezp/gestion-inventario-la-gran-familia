// hooks/useDonations.ts
'use client';
import { useState, useEffect } from 'react';
import { axiosClient } from '@/lib/axiosClient';

interface DonationItem {
  producto_id: string;
  descripcion_producto: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
}

interface Donation {
  donativo_id: string;
  donador_id: string;
  donor_name: string;
  donor_email: string;
  fecha: string;
  items: DonationItem[];
  total: number;
  total_con_descuento?: number;
}

export function useDonations(page = 1, limit = 500, filters = {}) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/donations', {
          params: { page, limit, ...filters },
          withCredentials: true, // ✅ envía cookies automáticamente
        });

        // Ajuste flexible según cómo tu backend devuelva los datos
        setDonations(res.data.donations || res.data);
        setTotal(res.data.total || res.data.length);
      } catch (err) {
        console.error('Error fetching donations:', err);
        setDonations([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [page, limit, JSON.stringify(filters)]);

  return { donations, loading, total };
}
