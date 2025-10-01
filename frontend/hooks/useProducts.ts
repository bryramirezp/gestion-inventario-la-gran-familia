'use client';
import { useState, useEffect } from 'react';
import { axiosClient } from '@/lib/axiosClient';

export interface Product {
  producto_id: string;
  nombre: string;
  descripcion?: string;
  categoria_producto_id?: string;
  categoria_nombre?: string;
  unidad_medida_id?: string;
  unidad_medida_nombre?: string;
  stock?: number;
  precio_referencia: number;
}

export function useProducts({
  page = 1,
  limit = 20,
  search = '',
  category = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = { page, limit };
        if (search) params.search = search;
        if (category) params.category = category;

        const res = await axiosClient.get('/products', { params, withCredentials: true });
        // El backend debe devolver { products: [...], total: number }
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, limit, search, category]);

  return { products, loading, total };
}
