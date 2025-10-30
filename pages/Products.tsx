import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import Table, { Column } from '../components/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/AlertDialog';
import {
  getFullProductDetails,
  productApi,
  categoryApi,
  brandApi,
  getUnits,
  warehouseApi,
  stockLotApi,
} from '../services/api';
import { Product, NewProduct, Category, Brand, Unit, Warehouse, NewStockLot } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Label, Input, Textarea, Select, FormError } from '../components/forms';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AnimatedWrapper } from '../components/Animated';
import { useAlerts } from '../contexts/AlertContext';
import useTableState from '../hooks/useTableState';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from '../hooks/useForm';
import { DatePicker } from '../components/DatePicker';
import Pagination from '../components/Pagination';
import { PlusCircleIcon } from '../components/icons/Icons';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];
const ITEMS_PER_PAGE = 10;

const ProductForm: React.FC<{
  product: Partial<NewProduct> | null;
  onSave: (product: NewProduct) => Promise<void>;
  onCancel: () => void;
  categories: Category[];
  brands: Brand[];
  units: Unit[];
}> = ({ product, onSave, onCancel, categories, brands, units }) => {
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
      if (formData.low_stock_threshold === null || formData.low_stock_threshold < 0) {
        tempErrors.low_stock_threshold = 'El límite de stock debe ser 0 o mayor.';
      }
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave(values as NewProduct);
    } catch (error: any) {
      setErrors({ form: error.message || 'Un error inesperado ocurrió.' });
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
            onChange={handleChange}
            required
            min="0"
            error={!!errors.low_stock_threshold}
          />
          <FormError message={errors.low_stock_threshold} />
        </div>
      </div>
      <FormError message={errors.form} className="text-center" />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</Button>
      </DialogFooter>
    </form>
  );
};

type RestockFormData = Omit<NewStockLot, 'product_id' | 'received_date'>;

interface RestockFormProps {
  warehouses: Warehouse[];
  onSave: (data: RestockFormData) => Promise<void>;
  onCancel: () => void;
}

const RestockForm: React.FC<RestockFormProps> = ({ warehouses, onSave, onCancel }) => {
  const { values, errors, handleChange, handleSubmit, setErrors, setValues } =
    useForm<RestockFormData>(
      {
        warehouse_id: 0,
        current_quantity: 1,
        expiry_date: null,
        unit_price: 0,
      },
      (formData) => {
        const tempErrors: Record<string, string> = {};
        if (!formData.warehouse_id) tempErrors.warehouse_id = 'Se debe seleccionar un almacén.';
        if (!formData.current_quantity || formData.current_quantity <= 0)
          tempErrors.current_quantity = 'La cantidad debe ser mayor a cero.';
        if (!formData.unit_price && formData.unit_price !== 0)
          tempErrors.unit_price = 'El precio unitario es requerido.';
        return tempErrors;
      }
    );

  const handleFormSubmit = async () => {
    try {
      await onSave(values);
    } catch (error: any) {
      setErrors({ form: error.message || 'An unexpected error occurred.' });
    }
  };

  const handleDateChange = (date: string | null) => {
    setValues((prev) => ({ ...prev, expiry_date: date }));
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="warehouse_id">Almacén</Label>
          <Select
            id="warehouse_id"
            name="warehouse_id"
            value={values.warehouse_id || ''}
            onChange={handleChange}
            required
            error={!!errors.warehouse_id}
          >
            <option value="">Selecciona un Almacén</option>
            {warehouses
              .filter((w) => w.is_active)
              .map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_name}
                </option>
              ))}
          </Select>
          <FormError message={errors.warehouse_id} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="current_quantity">Cantidad</Label>
            <Input
              id="current_quantity"
              name="current_quantity"
              type="number"
              value={values.current_quantity || ''}
              onChange={handleChange}
              required
              min="1"
              error={!!errors.current_quantity}
            />
            <FormError message={errors.current_quantity} />
          </div>
          <div>
            <Label htmlFor="unit_price">Precio Unitario</Label>
            <Input
              id="unit_price"
              name="unit_price"
              type="number"
              value={values.unit_price ?? '0'}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              error={!!errors.unit_price}
            />
            <FormError message={errors.unit_price} />
          </div>
        </div>
        <div>
          <Label>Fecha de Caducidad (Opcional)</Label>
          <DatePicker selectedDate={values.expiry_date} onSelectDate={handleDateChange} />
        </div>
        <FormError message={errors.form} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Agregar Stock</Button>
      </DialogFooter>
    </form>
  );
};

const Products: React.FC = () => {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<ProductDetail | null>(null);
  const { refreshNotifications } = useNotifications();
  const { addAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [productDetails, cats, brs, uns, whs] = await Promise.all([
        getFullProductDetails(''),
        categoryApi.getAll(''),
        brandApi.getAll(''),
        getUnits(''),
        warehouseApi.getAll(''),
      ]);
      setProducts(productDetails);
      setCategories(cats);
      setBrands(brs);
      setUnits(uns);
      setWarehouses(whs);
    } catch (error) {
      console.error('Failed to fetch products', error);
      addAlert('Error al cargar los productos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, stockStatus]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        p.product_name.toLowerCase().includes(searchLower) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower));
      const matchesCategory = selectedCategory
        ? p.category_id === parseInt(selectedCategory)
        : true;
      const matchesBrand = selectedBrand ? p.brand_id === parseInt(selectedBrand) : true;
      const matchesStock =
        stockStatus === 'all' ||
        (stockStatus === 'low' && p.total_stock < p.low_stock_threshold) ||
        (stockStatus === 'in_stock' && p.total_stock >= p.low_stock_threshold);
      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, stockStatus]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleOpenRestockModal = (product: ProductDetail) => {
    setRestockingProduct(product);
  };

  const handleCloseRestockModal = () => {
    setRestockingProduct(null);
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, [setSearchTerm, setCurrentPage]);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  }, [setSelectedCategory, setCurrentPage]);

  const handleBrandChange = useCallback((value: string) => {
    setSelectedBrand(value);
    setCurrentPage(1);
  }, [setSelectedBrand, setCurrentPage]);

  const handleStockStatusChange = useCallback((value: string) => {
    setStockStatus(value);
    setCurrentPage(1);
  }, [setStockStatus, setCurrentPage]);

  const handleSave = async (productData: NewProduct) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    try {
      if (editingProduct) {
        await productApi.update(token, editingProduct.product_id, productData);
        addAlert('¡Producto actualizado con éxito!', 'success');
      } else {
        await productApi.create(token, productData);
        addAlert('¡Producto creado con éxito!', 'success');
      }
      await fetchProducts();
      await refreshNotifications();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save product', error);
      throw error;
    }
  };

  const handleSaveRestock = async (data: RestockFormData) => {
    if (!restockingProduct) return;
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    try {
      const newStockLot: NewStockLot = {
        ...data,
        product_id: restockingProduct.product_id,
      };
      await stockLotApi.create(token, newStockLot);
      addAlert('¡Stock agregado con éxito!', 'success');
      await fetchProducts();
      await refreshNotifications();
      handleCloseRestockModal();
    } catch (error) {
      console.error('Failed to add stock', error);
      addAlert('Error al agregar stock. Por favor, inténtalo de nuevo.', 'error');
      throw error; // Propagate error to form
    }
  };

  const handleOpenAlert = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        return;
      }
      try {
        await productApi.delete(token, productToDelete.product_id);
        addAlert('Producto eliminado con éxito.', 'success');
        await fetchProducts();
        await refreshNotifications();
      } catch (error) {
        console.error('Failed to delete product', error);
        addAlert('Error al eliminar el producto. Puede que esté en uso.', 'error');
      } finally {
        setIsAlertOpen(false);
        setProductToDelete(null);
      }
    }
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

  const renderExpandedRow = (product: ProductDetail) => {
    const lotsByWarehouse = product.lots.reduce(
      (acc, lot) => {
        const whName =
          warehouses.find((w) => w.warehouse_id === lot.warehouse_id)?.warehouse_name ||
          'Almacén Desconocido';
        if (!acc[whName]) {
          acc[whName] = [];
        }
        acc[whName].push(lot);
        return acc;
      },
      {} as Record<string, typeof product.lots>
    );

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
                      <li key={lot.lot_id} className="text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {lot.current_quantity}
                        </span>{' '}
                        unidades | Recibido: {new Date(lot.received_date).toLocaleDateString()} |
                        Caducidad:{' '}
                        {lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString() : 'N/A'}
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
  };

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
            Mostrando {filteredProducts.length} de {products.length} productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando productos...</p>
          ) : (
            <Table
              columns={orderedColumns}
              data={paginatedProducts}
              onRestock={handleOpenRestockModal}
              onEdit={handleOpenModal}
              onDelete={handleOpenAlert}
              getKey={(p) => p.product_id}
              renderExpandedRow={renderExpandedRow}
              {...tableState}
            />
          )}
          {filteredProducts.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={handleCloseModal}
            categories={categories}
            brands={brands}
            units={units}
          />
        </DialogContent>
      </Dialog>

      <Dialog isOpen={!!restockingProduct} onClose={handleCloseRestockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Stock para: {restockingProduct?.product_name}</DialogTitle>
          </DialogHeader>
          {restockingProduct && (
            <RestockForm
              warehouses={warehouses}
              onSave={handleSaveRestock}
              onCancel={handleCloseRestockModal}
            />
          )}
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
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default Products;
