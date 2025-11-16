import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/presentation/components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/AlertDialog';
import {
  getFullProductDetails,
  productApi,
  categoryApi,
  brandApi,
  getUnits,
  warehouseApi,
  GetFullProductDetailsFilters,
  adjustmentApi,
} from '@/data/api';
import { Product, NewProduct, Category, Brand, Unit, Warehouse } from '@/domain/types';
import { useNotifications } from '@/app/providers/NotificationProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Label, Input, Textarea, Select, FormError } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { useAlerts } from '@/app/providers/AlertProvider';
import useTableState from '@/infrastructure/hooks/useTableState';
import { useForm } from '@/infrastructure/hooks/useForm';
import Pagination from '@/presentation/components/ui/Pagination';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import { validateNumericInput } from '@/infrastructure/utils/validation.util';
import { AdjustmentForm } from '@/presentation/features/inventory/AdjustmentForm';
import { MovementForm } from '@/presentation/features/inventory/MovementForm';
import MovementHistoryModal from '@/presentation/features/inventory/MovementHistoryModal';
import { StockLot } from '@/domain/types';
import { stockMovementApi } from '@/data/api';
// import { PlusCircleIcon } from '@/presentation/components/icons/Icons';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];
const ITEMS_PER_PAGE = 10;

const ProductForm: React.FC<{
  product: Partial<NewProduct> | null;
  onSave: (product: NewProduct) => Promise<void>;
  onCancel: () => void;
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  isSubmitting?: boolean;
}> = ({ product, onSave, onCancel, categories, brands, units, isSubmitting = false }) => {
  const isEditing = !!product?.product_id;

  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<Partial<NewProduct>>(
    product || {
      product_name: '',
      sku: '',
      description: '',
      category_id: undefined,
      brand_id: null,
      official_unit_id: undefined,
      low_stock_threshold: 5,
    },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.product_name?.trim())
        tempErrors.product_name = 'El nombre del producto es requerido.';
      if (!formData.category_id) tempErrors.category_id = 'La categoría es requerida.';
      if (!formData.official_unit_id) tempErrors.official_unit_id = 'La unidad es requerida.';
      
      const thresholdValidation = validateNumericInput(formData.low_stock_threshold, {
        min: 0,
        max: 1000000,
        allowZero: true,
        allowNegative: false,
        defaultValue: 5,
      });
      if (!thresholdValidation.isValid) {
        tempErrors.low_stock_threshold = thresholdValidation.error || 'El límite de stock debe ser 0 o mayor.';
      }
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave(values as NewProduct);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Un error inesperado ocurrió.' });
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="space-y-4 p-6">
      <div>
        <Label htmlFor="product_name">Nombre del Producto *</Label>
        <Input
          id="product_name"
          name="product_name"
          value={values.product_name || ''}
          onChange={handleChange}
          required
          error={!!errors.product_name}
        />
        <FormError message={errors.product_name} />
      </div>
      <div>
        <Label htmlFor="sku">SKU (Código de Barras)</Label>
        <Input id="sku" name="sku" value={values.sku || ''} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={values.description || ''}
          onChange={handleChange}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category_id">Categoría *</Label>
          <Select
            name="category_id"
            value={values.category_id || ''}
            onChange={handleChange}
            required
            error={!!errors.category_id}
          >
            <option value="">Selecciona una Categoría</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </Select>
          <FormError message={errors.category_id} />
        </div>
        <div>
          <Label htmlFor="brand_id">Marca</Label>
          <Select name="brand_id" value={values.brand_id || ''} onChange={handleChange}>
            <option value="">Selecciona una Marca (Opcional)</option>
            {brands.map((b) => (
              <option key={b.brand_id} value={b.brand_id}>
                {b.brand_name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="official_unit_id">Unidad de Medida *</Label>
          <Select
            name="official_unit_id"
            value={values.official_unit_id || ''}
            onChange={handleChange}
            required
            error={!!errors.official_unit_id}
          >
            <option value="">Selecciona una Unidad</option>
            {units.map((u) => (
              <option
                key={u.unit_id}
                value={u.unit_id}
              >{`${u.unit_name} (${u.abbreviation})`}</option>
            ))}
          </Select>
          <FormError message={errors.official_unit_id} />
        </div>
        <div>
          <Label htmlFor="low_stock_threshold">Límite de Stock Bajo *</Label>
          <Input
            type="number"
            id="low_stock_threshold"
            name="low_stock_threshold"
            value={values.low_stock_threshold ?? 5}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Permitir valores vacíos o valores que estén siendo escritos
              if (inputValue === '' || inputValue === '-') {
                handleChange(e);
                return;
              }
              // Validar solo valores negativos o malformados durante la escritura
              const numValue = Number(inputValue);
              if (isNaN(numValue) || (numValue < 0 && inputValue !== '')) {
                setErrors({ ...errors, low_stock_threshold: 'No se permiten valores negativos.' });
                return;
              }
              // Si es válido, actualizar el valor
              handleChange(e);
              // Limpiar error si existe
              if (errors.low_stock_threshold) {
                setErrors({ ...errors, low_stock_threshold: undefined });
              }
            }}
            onBlur={(e) => {
              // Validar completamente al perder el foco
              const validation = validateNumericInput(e.target.value, {
                min: 0,
                max: 1000000,
                allowZero: true,
                allowNegative: false,
                defaultValue: 5,
              });
              if (!validation.isValid) {
                setErrors({ ...errors, low_stock_threshold: validation.error });
                // Restaurar valor por defecto si es inválido
                handleChange({
                  ...e,
                  target: { ...e.target, value: String(validation.value) },
                });
              } else {
                // Asegurar que el valor esté dentro del rango
                const numValue = Number(e.target.value);
                if (numValue > 1000000) {
                  setErrors({ ...errors, low_stock_threshold: 'El valor debe ser menor o igual a 1000000.' });
                  handleChange({
                    ...e,
                    target: { ...e.target, value: '1000000' },
                  });
                } else if (errors.low_stock_threshold) {
                  setErrors({ ...errors, low_stock_threshold: undefined });
                }
              }
            }}
            required
            min="0"
            max="1000000"
            error={!!errors.low_stock_threshold}
          />
          <FormError message={errors.low_stock_threshold} />
        </div>
      </div>
      <FormError message={errors.form} className="text-center" />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// RestockForm eliminado - Para agregar stock, usar el sistema de donaciones que crea movimientos ENTRADA automáticamente

const Products: React.FC = () => {
  const { addAlert } = useAlerts();
  const { refreshNotifications } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedLotForAdjustment, setSelectedLotForAdjustment] = useState<StockLot | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedLotForMovement, setSelectedLotForMovement] = useState<StockLot | null>(null);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<ProductDetail | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLotForHistory, setSelectedLotForHistory] = useState<StockLot | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Construir filtros para la query optimizada
  const buildFilters = useCallback((): GetFullProductDetailsFilters => {
    const filters: GetFullProductDetailsFilters = {
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      orderBy: 'product_name',
      orderDirection: 'asc',
    };

    if (selectedCategory) {
      filters.category_id = parseInt(selectedCategory);
    }

    if (selectedBrand) {
      filters.brand_id = parseInt(selectedBrand);
    }

    if (searchTerm) {
      filters.search = searchTerm;
    }

    if (stockStatus === 'low') {
      filters.lowStockOnly = true;
    }

    return filters;
  }, [currentPage, selectedCategory, selectedBrand, searchTerm, stockStatus]);

  const filters = buildFilters();

  // React Query: Cargar productos con filtros
  // Los filtros son parte del queryKey para que React Query cachee correctamente
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useApiQuery<ProductDetail[]>(
    ['products', 'list', filters],
    (token) => getFullProductDetails(token, filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutos (datos pueden cambiar frecuentemente)
    }
  );

  // React Query: Cargar datos estáticos (categorías, marcas, unidades, almacenes)
  // Estos datos cambian raramente, así que los cacheamos por más tiempo
  const { data: categories = [], isLoading: categoriesLoading } = useApiQuery<Category[]>(
    ['categories'],
    (token) => categoryApi.getAll(token),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos (datos estáticos)
    }
  );

  const { data: brands = [], isLoading: brandsLoading } = useApiQuery<Brand[]>(
    ['brands'],
    (token) => brandApi.getAll(token),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const { data: units = [], isLoading: unitsLoading } = useApiQuery<Unit[]>(
    ['units'],
    (token) => getUnits(token),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const { data: warehouses = [], isLoading: warehousesLoading } = useApiQuery<Warehouse[]>(
    ['warehouses'],
    (token) => warehouseApi.getAll(token),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const loading = productsLoading || categoriesLoading || brandsLoading || unitsLoading || warehousesLoading;

  // Calcular totalProducts para paginación
  const totalProducts = useMemo(() => {
    if (products.length < ITEMS_PER_PAGE) {
      // Última página
      return (currentPage - 1) * ITEMS_PER_PAGE + products.length;
    } else {
      // Hay más páginas (estimamos mínimo)
      return currentPage * ITEMS_PER_PAGE;
    }
  }, [products.length, currentPage]);

  // Manejar errores de carga
  useEffect(() => {
    if (productsError) {
      addAlert('Error al cargar los productos.', 'error');
    }
  }, [productsError, addAlert]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, stockStatus]);

  // Los productos ya vienen filtrados y paginados del backend
  const paginatedProducts = products;

  // Handlers de modales (definidos antes de las mutaciones para poder usarlos en onSuccess)
  const handleOpenModal = useCallback((product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingProduct(null);
    setIsModalOpen(false);
  }, []);


  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  }, []);

  const handleBrandChange = useCallback((value: string) => {
    setSelectedBrand(value);
    setCurrentPage(1);
  }, []);

  const handleStockStatusChange = useCallback((value: string) => {
    setStockStatus(value);
    setCurrentPage(1);
  }, []);

  // React Query Mutation: Crear/Actualizar producto
  const saveProductMutation = useApiMutation<
    Product,
    { productId?: number; data: NewProduct }
  >(
    async ({ productId, data }, token) => {
      if (productId) {
        return (await productApi.update(token, productId, data)) as Product;
      } else {
        return await productApi.create(token, data);
      }
    },
    {
      onSuccess: (data, variables) => {
        if (variables.productId) {
          addAlert('¡Producto actualizado con éxito!', 'success');
        } else {
          addAlert('¡Producto creado con éxito!', 'success');
        }
        refreshNotifications();
        handleCloseModal();
      },
      onError: (error) => {
        addAlert(`Error al guardar producto: ${error.message}`, 'error');
      },
      invalidateQueries: [
        ['products'], // Invalidar todas las queries de productos (incluye todas las variantes con filtros)
      ],
    }
  );

  const handleSave = async (productData: NewProduct) => {
    try {
      await saveProductMutation.mutateAsync({
        productId: editingProduct?.product_id,
        data: productData,
      });
    } catch (error) {
      // Error ya manejado en onError del mutation
      throw error;
    }
  };

  // Funcionalidad de Restock eliminada - Para agregar stock, usar el sistema de donaciones

  const handleOpenAlert = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  // React Query Mutation: Eliminar producto con optimistic update
  const deleteProductMutation = useApiMutation<boolean, number>(
    async (productId, token) => {
      return await productApi.delete(token, productId);
    },
    {
      onSuccess: () => {
        addAlert('Producto eliminado con éxito.', 'success');
        refreshNotifications();
        setIsAlertOpen(false);
        setProductToDelete(null);
      },
      onError: (error) => {
        addAlert(`Error al eliminar el producto: ${error.message}`, 'error');
      },
      // Optimistic update: remover el producto de la lista inmediatamente
      optimisticUpdate: {
        queryKey: ['products', 'list', filters],
        updateFn: (oldData, productId) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.filter((p: ProductDetail) => p.product_id !== productId);
        },
      },
      invalidateQueries: [
        ['products'], // Invalidar todas las queries de productos para sincronizar con servidor
      ],
    }
  );

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProductMutation.mutateAsync(productToDelete.product_id);
      } catch (error) {
        // Error ya manejado en onError del mutation
      }
    }
  };

  // Funcionalidad de Ajustes
  const createAdjustmentMutation = useApiMutation<
    any,
    { lotId: number; quantityAfter: number; reason: string }
  >(
    async ({ lotId, quantityAfter, reason }, token) => {
      return await adjustmentApi.create(token, lotId, quantityAfter, reason);
    },
    {
      onSuccess: () => {
        addAlert('Ajuste de inventario creado con éxito. Pendiente de aprobación.', 'success');
        setIsAdjustmentModalOpen(false);
        setSelectedLotForAdjustment(null);
      },
      onError: (error) => {
        addAlert(`Error al crear ajuste: ${error.message}`, 'error');
      },
      invalidateQueries: [['adjustments'], ['products']],
    }
  );

  const handleOpenAdjustmentModal = (lot: StockLot) => {
    setSelectedLotForAdjustment(lot);
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setSelectedLotForAdjustment(null);
  };

  const handleSaveAdjustment = async (data: { lot_id: number | null; quantity_after: number; reason: string }) => {
    if (!data.lot_id) {
      throw new Error('Se debe seleccionar un lote');
    }
    await createAdjustmentMutation.mutateAsync({
      lotId: data.lot_id,
      quantityAfter: data.quantity_after,
      reason: data.reason,
    });
  };

  // Funcionalidad de Movimientos
  const createMovementMutation = useApiMutation<
    any,
    {
      lotId: number;
      movementTypeId: number;
      quantity: number;
      notes?: string;
      requestingDepartment?: string;
      recipientOrganization?: string;
    }
  >(
    async ({ lotId, movementTypeId, quantity, notes, requestingDepartment, recipientOrganization }, token) => {
      return await stockMovementApi.create(
        token,
        lotId,
        movementTypeId,
        quantity,
        notes,
        requestingDepartment,
        recipientOrganization
      );
    },
    {
      onSuccess: () => {
        addAlert('Movimiento de salida registrado con éxito', 'success');
        setIsMovementModalOpen(false);
        setSelectedLotForMovement(null);
        setSelectedProductForMovement(null);
      },
      onError: (error) => {
        addAlert(`Error al registrar movimiento: ${error.message}`, 'error');
      },
      invalidateQueries: [['movements'], ['products'], ['stockMovements']],
    }
  );

  const handleOpenMovementModal = (lot: StockLot, product: ProductDetail) => {
    setSelectedLotForMovement(lot);
    setSelectedProductForMovement(product);
    setIsMovementModalOpen(true);
  };

  const handleCloseMovementModal = () => {
    setIsMovementModalOpen(false);
    setSelectedLotForMovement(null);
    setSelectedProductForMovement(null);
  };

  const handleSaveMovement = async (data: {
    lot_id: number | null;
    movement_type_id: number | null;
    quantity: number;
    notes: string;
    requesting_department: string;
    recipient_organization: string;
  }) => {
    if (!data.lot_id || !data.movement_type_id) {
      throw new Error('Se deben completar todos los campos requeridos');
    }
    await createMovementMutation.mutateAsync({
      lotId: data.lot_id,
      movementTypeId: data.movement_type_id,
      quantity: data.quantity,
      notes: data.notes || undefined,
      requestingDepartment: data.requesting_department || undefined,
      recipientOrganization: data.recipient_organization || undefined,
    });
  };

  const handleOpenHistoryModal = (lot: StockLot) => {
    setSelectedLotForHistory(lot);
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedLotForHistory(null);
  };

  const columns: Column<ProductDetail>[] = useMemo(
    () => [
      { header: 'Nombre', accessor: 'product_name' },
      { header: 'SKU', accessor: 'sku' },
      { header: 'Categoría', accessor: 'category_name' },
      { header: 'Marca', accessor: 'brand_name' },
      {
        header: 'Stock Total',
        accessor: (item) => (
          <Badge
            variant={
              item.total_stock < item.low_stock_threshold ? 'inventory-low' : 'inventory-high'
            }
          >
            {`${item.total_stock} ${item.unit_abbreviation}`}
          </Badge>
        ),
      },
      {
        header: 'Próxima Caducidad',
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
      { header: 'Límite Stock Bajo', accessor: 'low_stock_threshold' },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<ProductDetail>(columns, 'products-table');

  // Crear mapa de warehouses para búsqueda O(1) en lugar de O(n) con find
  const warehouseMap = useMemo(() => {
    return new Map(warehouses.map((w) => [w.warehouse_id, w.warehouse_name]));
  }, [warehouses]);

  // Función helper memoizada para calcular lotsByWarehouse (optimización de rendimiento)
  const calculateLotsByWarehouse = useCallback(
    (lots: ProductDetail['lots']) => {
      return lots.reduce(
        (acc, lot) => {
          const whName = warehouseMap.get(lot.warehouse_id) || 'Almacén Desconocido';
          if (!acc[whName]) {
            acc[whName] = [];
          }
          acc[whName].push(lot);
          return acc;
        },
        {} as Record<string, typeof lots>
      );
    },
    [warehouseMap]
  );

  // Memoizar renderExpandedRow para evitar recálculos innecesarios
  const renderExpandedRow = useCallback(
    (product: ProductDetail) => {
      // Usar función optimizada para calcular lotsByWarehouse (O(1) lookup en lugar de O(n))
      const lotsByWarehouse = calculateLotsByWarehouse(product.lots);

      return (
        <div className="p-4 bg-background dark:bg-dark-background">
          <p className="text-sm text-muted-foreground mb-4">
            {product.description || 'No hay descripción disponible.'}
          </p>
          <div>
            <h4 className="font-semibold text-sm mb-2">Desglose de Stock por Lote</h4>
            {Object.keys(lotsByWarehouse).length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {Object.entries(lotsByWarehouse).map(([whName, lots]) => (
                  <div key={whName}>
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      {whName}
                    </p>
                    <ul className="text-sm list-disc list-inside mt-1 space-y-1">
                      {lots.map((lot) => (
                        <li key={lot.lot_id} className="text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                          <span>
                            <span className="font-semibold text-foreground">
                              {lot.current_quantity}
                            </span>{' '}
                            unidades | Recibido: {new Date(lot.received_date).toLocaleDateString()} |
                            Caducidad:{' '}
                            {lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString() : 'N/A'}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenMovementModal(lot, product)}
                              className="text-xs"
                            >
                              Registrar Salida
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenHistoryModal(lot)}
                              className="text-xs"
                            >
                              Historial
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAdjustmentModal(lot)}
                              className="text-xs"
                            >
                              Ajustar
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No se encontraron lotes para este producto.
              </p>
            )}
          </div>
        </div>
      );
    },
    [calculateLotsByWarehouse]
  );

  return (
    <AnimatedWrapper>
      <Header
        title="Productos"
        description="Administra el catálogo de productos en tu inventario."
        buttonText="Agregar Producto"
        onButtonClick={() => handleOpenModal()}
      />
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full sm:w-48"
              />
              <Select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
              <Select value={selectedBrand} onChange={(e) => handleBrandChange(e.target.value)}>
                <option value="">Todas las Marcas</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>
                    {b.brand_name}
                  </option>
                ))}
              </Select>
              <Select value={stockStatus} onChange={(e) => handleStockStatusChange(e.target.value)}>
                <option value="all">Todo el Stock</option>
                <option value="in_stock">En Stock</option>
                <option value="low">Stock Bajo</option>
              </Select>
            </div>
          )}
        >
          <CardTitle>Todos los Productos</CardTitle>
          <CardDescription>
            Mostrando {paginatedProducts.length} de {totalProducts} productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando productos...</p>
          ) : (
            <ResponsiveTable
              columns={orderedColumns}
              data={paginatedProducts}
              onEdit={handleOpenModal}
              onDelete={handleOpenAlert}
              getKey={(p) => p.product_id}
              renderExpandedRow={renderExpandedRow}
              renderMobileCard={(product) => (
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{product.product_name}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>SKU: {product.sku || 'N/A'}</div>
                    <div>Categoría: {product.category_name}</div>
                    <div>
                      Stock: {product.total_stock} {product.unit_abbreviation}
                    </div>
                  </div>
                </div>
              )}
              {...tableState}
            />
          )}
          {totalProducts > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalProducts}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent maxWidth="4xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={handleCloseModal}
            categories={categories}
            brands={brands}
            units={units}
            isSubmitting={saveProductMutation.isPending}
          />
          </div>
        </DialogContent>
      </Dialog>


      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "
              {productToDelete?.product_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)} disabled={deleteProductMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Movimiento de Salida */}
      <Dialog isOpen={isMovementModalOpen} onClose={handleCloseMovementModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Salida</DialogTitle>
          </DialogHeader>
          {selectedLotForMovement && selectedProductForMovement && (
            <MovementForm
              onSave={handleSaveMovement}
              onCancel={handleCloseMovementModal}
              isSubmitting={createMovementMutation.isLoading}
              category="SALIDA"
              initialProductId={selectedProductForMovement.product_id}
              initialWarehouseId={selectedLotForMovement.warehouse_id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Historial de Movimientos */}
      {isHistoryModalOpen && selectedLotForHistory && (
        <MovementHistoryModal lot={selectedLotForHistory} onClose={handleCloseHistoryModal} />
      )}

      {/* Dialog de Ajuste de Inventario */}
      <Dialog isOpen={isAdjustmentModalOpen} onClose={handleCloseAdjustmentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Ajuste de Inventario</DialogTitle>
          </DialogHeader>
          {selectedLotForAdjustment && (
            <AdjustmentForm
              onSave={handleSaveAdjustment}
              onCancel={handleCloseAdjustmentModal}
              isSubmitting={createAdjustmentMutation.isLoading}
              initialLotId={selectedLotForAdjustment.lot_id}
            />
          )}
        </DialogContent>
      </Dialog>
    </AnimatedWrapper>
  );
};

export default Products;
