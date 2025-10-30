import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
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
import { warehouseApi, getFullProductDetails } from '../services/api';
import { Warehouse, NewWarehouse } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Label, Input, Textarea, Select, FormError } from '../components/forms';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AnimatedWrapper } from '../components/Animated';
import { useAlerts } from '../contexts/AlertContext';
import { BuildingStorefrontIcon, CubeIcon } from '../components/icons/Icons';
import Pagination from '../components/Pagination';
import { useForm } from '../hooks/useForm';
import { useAuth } from '../contexts/AuthContext';

const WarehouseForm: React.FC<{
  warehouse: Partial<NewWarehouse> | null;
  onSave: (warehouse: NewWarehouse) => Promise<void>;
  onCancel: () => void;
}> = ({ warehouse, onSave, onCancel }) => {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<NewWarehouse>(
    (warehouse || {
      warehouse_name: '',
      location_description: '',
      is_active: true,
    }) as NewWarehouse,
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.warehouse_name)
        tempErrors.warehouse_name = 'El nombre del almacén es requerido.';
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave(values);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="warehouse_name">Nombre del Almacén</Label>
        <Input
          id="warehouse_name"
          name="warehouse_name"
          value={values.warehouse_name || ''}
          onChange={handleChange}
          required
          error={!!errors.warehouse_name}
        />
        <FormError message={errors.warehouse_name} />
      </div>
      <div>
        <Label htmlFor="location_description">Descripción de la Ubicación</Label>
        <Textarea
          id="location_description"
          name="location_description"
          value={values.location_description || ''}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={values.is_active}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary dark:border-dark-border"
        />
        <Label htmlFor="is_active" className="mb-0">
          Activo
        </Label>
      </div>
      <FormError message={errors.form} />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Almacén</Button>
      </DialogFooter>
    </form>
  );
};

interface WarehouseCardProps {
  warehouse: Warehouse & { productCount: number };
}
const WarehouseCard: React.FC<WarehouseCardProps> = React.memo(({ warehouse }) => (
  <Link to={`/warehouses/${warehouse.warehouse_id}`}>
    <Card className="h-full border-l-4 border-transparent hover:border-primary dark:hover:border-primary hover:shadow-medium dark:hover:shadow-dark-medium transition-all duration-300 group">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="group-hover:text-primary transition-colors">
              {warehouse.warehouse_name}
            </CardTitle>
            <CardDescription>{warehouse.location_description}</CardDescription>
          </div>
          <Badge variant={warehouse.is_active ? 'success' : 'secondary'}>
            {warehouse.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground dark:text-dark-muted-foreground">
          <CubeIcon className="w-4 h-4 mr-2" />
          <span>{warehouse.productCount} productos únicos</span>
        </div>
      </CardContent>
    </Card>
  </Link>
));

const ITEMS_PER_PAGE = 6;

const Warehouses: React.FC = () => {
  const { getToken } = useAuth();
  const [warehouses, setWarehouses] = useState<(Warehouse & { productCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const { addAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const [data, allProducts] = await Promise.all([
        warehouseApi.getAll(''),
        getFullProductDetails(''),
      ]);
      const warehousesWithCount = data.map((wh) => ({
        ...wh,
        productCount: allProducts.filter((p) =>
          p.lots.some((l) => l.warehouse_id === wh.warehouse_id)
        ).length,
      }));
      setWarehouses(warehousesWithCount);
    } catch (error) {
      // Error al cargar almacenes - manejado por el sistema de alertas
      addAlert('Error al cargar los almacenes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        w.warehouse_name.toLowerCase().includes(searchLower) ||
        (w.location_description && w.location_description.toLowerCase().includes(searchLower));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && w.is_active) ||
        (statusFilter === 'inactive' && !w.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [warehouses, searchTerm, statusFilter]);

  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWarehouses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWarehouses, currentPage]);

  const handleOpenModal = (warehouse: Warehouse | null = null) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingWarehouse(null);
    setIsModalOpen(false);
  };

  const handleSave = async (warehouseData: NewWarehouse) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    if (editingWarehouse) {
      await warehouseApi.update(token, editingWarehouse.warehouse_id, warehouseData);
      addAlert('¡Almacén actualizado con éxito!', 'success');
    } else {
      await warehouseApi.create(token, warehouseData);
      addAlert('¡Almacén creado con éxito!', 'success');
    }
    fetchWarehouses();
    handleCloseModal();
  };


  const handleConfirmDelete = async () => {
    if (warehouseToDelete) {
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        return;
      }
      try {
        await warehouseApi.delete(token, warehouseToDelete.warehouse_id);
        addAlert('Almacén eliminado con éxito.', 'success');
        fetchWarehouses();
      } catch (error) {
        // Error al eliminar almacén - manejado por el sistema de alertas
        addAlert('Error al eliminar el almacén.', 'error');
      } finally {
        setIsAlertOpen(false);
        setWarehouseToDelete(null);
      }
    }
  };

  return (
    <AnimatedWrapper>
      <Header
        title="Almacenes"
        description="Administra todas las ubicaciones de almacenes."
        buttonText="Agregar Almacén"
        onButtonClick={() => handleOpenModal()}
      />
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar nombre o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </Select>
            </div>
          )}
        >
          <CardTitle>Todos los Almacenes</CardTitle>
          <CardDescription>
            Mostrando {filteredWarehouses.length} de {warehouses.length} almacenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando almacenes...</p>
          ) : paginatedWarehouses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedWarehouses.map((wh, index) => (
                <AnimatedWrapper key={wh.warehouse_id} delay={index * 0.1}>
                  <WarehouseCard warehouse={wh} />
                </AnimatedWrapper>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground dark:text-dark-muted-foreground">
              <BuildingStorefrontIcon className="mx-auto h-12 w-12" />
              <h3 className="mt-2 text-sm font-medium text-foreground dark:text-dark-foreground">
                No se encontraron almacenes
              </h3>
              <p className="mt-1 text-sm">Prueba a ajustar la búsqueda o los filtros.</p>
            </div>
          )}
          {filteredWarehouses.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredWarehouses.length}
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
              {editingWarehouse ? 'Editar Almacén' : 'Agregar Nuevo Almacén'}
            </DialogTitle>
          </DialogHeader>
          <WarehouseForm
            warehouse={editingWarehouse}
            onSave={handleSave}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el almacén "
              {warehouseToDelete?.warehouse_name}".
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

export default Warehouses;
