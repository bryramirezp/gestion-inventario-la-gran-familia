import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFullProductDetails, warehouseApi, categoryApi } from '@/data/api';
import { Warehouse, Category } from '@/domain/types';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { Input, Select } from '@/presentation/components/forms';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import StockLotsModal from '@/presentation/features/products/StockLotsModal';
import useTableState from '@/infrastructure/hooks/useTableState';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import { ChevronLeftIcon } from '@/presentation/components/icons/Icons';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];

const WarehouseDetail: React.FC = () => {
  const { data: userProfile } = useUserProfile();
  const { id } = useParams<{ id: string }>();
  const warehouseId = id ? parseInt(id, 10) : undefined;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewingLots, setViewingLots] = useState<ProductDetail | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!warehouseId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [wh, prods, cats] = await Promise.all([
          warehouseApi.getById('', warehouseId),
          getFullProductDetails('', warehouseId),
          categoryApi.getAll(''),
        ]);
        setWarehouse(wh || null);
        setProducts(prods as ProductDetail[]);
        setAllCategories(cats);
      } catch (error) {
        // Error al cargar datos del almacén - manejado internamente
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [warehouseId]);

  const availableCategories = useMemo(() => {
    const categoryIdsInWarehouse = new Set(products.map((p) => p.category_id));
    return allCategories.filter((c) => categoryIdsInWarehouse.has(c.category_id));
  }, [products, allCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory
        ? product.category_id === parseInt(selectedCategory)
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const columns: Column<ProductDetail>[] = useMemo(
    () => [
      { header: 'Nombre', accessor: 'product_name' },
      { header: 'SKU', accessor: 'sku' },
      { header: 'Categoría', accessor: 'category_name' },
      {
        header: 'Stock',
        accessor: (item) => (
          <Button
            variant="ghost"
            className="h-auto p-0 font-normal text-left"
            onClick={() => setViewingLots(item)}
          >
            <Badge
              variant={
                item.total_stock < item.low_stock_threshold ? 'inventory-low' : 'inventory-high'
              }
            >
              {`${item.total_stock} ${item.unit_abbreviation}`}
            </Badge>
          </Button>
        ),
      },
      {
        header: 'Próx. Caducidad',
        accessor: (item) => {
          if (item.days_to_expiry === null || item.soonest_expiry_date === null) {
            return <Badge variant="secondary">N/A</Badge>;
          }
          if (item.days_to_expiry < 0) {
            return <Badge variant="destructive">Caducado</Badge>;
          }
          if (item.days_to_expiry <= 30) {
            return (
              <Badge variant="warning">
                {new Date(item.soonest_expiry_date).toLocaleDateString()}
              </Badge>
            );
          }
          return (
            <Badge variant="success">
              {new Date(item.soonest_expiry_date).toLocaleDateString()}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<ProductDetail>(
    columns,
    `warehouse-detail-${warehouseId}-table`
  );

  if (loading) return <LoadingSpinner size="lg" message="Cargando detalles del almacén..." centerScreen />;
  if (!warehouse)
    return (
      <div>
        Almacén no encontrado.{' '}
        <Link to="/warehouses" className="text-primary hover:underline">
          Volver
        </Link>
      </div>
    );

  return (
    <AnimatedWrapper>
      <div className="mb-6">
        <Button as={Link} to="/warehouses" variant="ghost" className="mb-2">
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Volver a Almacenes
        </Button>
        <Header
          title={warehouse.warehouse_name}
          description={warehouse.location_description || 'Vista detallada del inventario.'}
        />
      </div>
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Todas las Categorías</option>
                {availableCategories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        >
          <CardTitle>Inventario</CardTitle>
          <CardDescription>
            Mostrando {filteredProducts.length} de {products.length} productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            columns={orderedColumns}
            data={filteredProducts}
            getKey={(p) => p.product_id}
            renderMobileCard={(product) => (
              <div className="space-y-2">
                <div className="font-semibold text-lg">{product.product_name}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>SKU: {product.sku || 'N/A'}</div>
                  <div>Categoría: {product.category_name}</div>
                  <div>
                    Stock: {product.total_stock} {product.unit_abbreviation}
                  </div>
                  {product.low_stock_threshold && (
                    <div className="text-xs">
                      Umbral: {product.low_stock_threshold} {product.unit_abbreviation}
                    </div>
                  )}
                </div>
              </div>
            )}
            {...tableState}
          />
        </CardContent>
      </Card>

      {viewingLots && <StockLotsModal product={viewingLots} onClose={() => setViewingLots(null)} />}
    </AnimatedWrapper>
  );
};

export default WarehouseDetail;
