'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useRouter } from 'next/navigation';


export default function Products() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();

  const { products, loading, total } = useProducts({
    page,
    limit,
    search: searchTerm,
    category: selectedCategory,
  });

  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory ? p.categoria_nombre === selectedCategory : true)
  );

  const categories = Array.from(new Set(products.map((p) => p.categoria_nombre || 'Sin categoría')));

  const totalProducts = products.length;
  const averagePrice =
    products.reduce((sum, p) => sum + Number(p.precio_referencia || 0), 0) /
    (products.length || 1);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
            <p className="text-gray-600 mt-1">Gestión del catálogo de productos alimentarios</p>
          </div>
          <Button className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-400/90 hover:to-yellow-400/90 flex items-center gap-2"
          onClick={() => router.push('/products/new')}>
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-orange-50 rounded-lg shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
            </div>
            <Package className="h-6 w-6 text-orange-500" />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{categories.length}</p>
            </div>
            <Package className="h-6 w-6 text-blue-600" />
          </div>

          <div className="p-4 bg-green-50 rounded-lg shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
              <p className="text-2xl font-bold text-green-600 mt-1">${averagePrice.toFixed(2)}</p>
            </div>
            <Package className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Input
            placeholder="Buscar productos por nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // resetear a página 1 al buscar
            }}
            className="flex-1"
          />
          <select
            className="border rounded px-3 py-2"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1); // resetear a página 1 al filtrar
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Tabla de productos con recuadro scrollable */}
        <div className="border rounded-lg p-2 bg-white shadow-sm">
          <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Categoría</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Precio</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unidad</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.producto_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">{product.nombre}</td>
                    <td className="px-4 py-2">{product.categoria_nombre || 'Sin categoría'}</td>
                    <td className="px-4 py-2 text-green-600">${product.precio_referencia.toFixed(2)}</td>
                    <td className="px-4 py-2">{product.unidad_medida_nombre || '-'}</td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Mostrando {page*limit - limit + 1}-{Math.min(page*limit, total)} de {total}
          </span>
          <div className="flex gap-2">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>«</Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i + 1 === page ? 'default' : 'outline'}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>»</Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="p-12 text-center border rounded-lg">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No hay productos que coincidan con "${searchTerm}"`
                : 'Aún no hay productos registrados en el catálogo'}
            </p>
            <Button className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-400/90 hover:to-yellow-400/90 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Agregar Primer Producto
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
