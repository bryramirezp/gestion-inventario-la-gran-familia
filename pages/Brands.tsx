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
import { brandApi } from '../services/api';
import { Brand, NewBrand } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Label, Input, FormError } from '../components/forms';
import { Button } from '../components/Button';
import { AnimatedWrapper } from '../components/Animated';
import { useAlerts } from '../contexts/AlertContext';
import { useForm } from '../hooks/useForm';
import useTableState from '../hooks/useTableState';
import { TagIcon } from '../components/icons/Icons';
import { useAuth } from '../contexts/AuthContext';

const BrandForm: React.FC<{
  brand: Partial<NewBrand> | null;
  onSave: (brand: NewBrand) => Promise<void>;
  onCancel: () => void;
}> = ({ brand, onSave, onCancel }) => {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<NewBrand>(
    (brand || { brand_name: '' }) as NewBrand,
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.brand_name) tempErrors.brand_name = 'El nombre de la marca es requerido.';
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

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-muted dark:bg-dark-muted">
            <TagIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-grow w-full">
            <Label htmlFor="brand_name">Nombre de la Marca</Label>
            <Input
              id="brand_name"
              name="brand_name"
              value={values.brand_name || ''}
              onChange={handleChange}
              required
              error={!!errors.brand_name}
              placeholder="ej. Genérico"
            />
            <FormError message={errors.brand_name} />
          </div>
        </div>
        <FormError message={errors.form} className="mt-4 text-center" />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Marca</Button>
      </DialogFooter>
    </form>
  );
};

const Brands: React.FC = () => {
  const { getToken } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const { addAlert } = useAlerts();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const data = await brandApi.getAll('');
      setBrands(data);
    } catch (error) {
      // Error al cargar marcas - manejado por el sistema de alertas
      addAlert('Error al cargar las marcas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => b.brand_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [brands, searchTerm]);

  const handleOpenModal = (brand: Brand | null = null) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingBrand(null);
    setIsModalOpen(false);
  };

  const handleSave = async (brandData: NewBrand) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    if (editingBrand) {
      await brandApi.update(token, editingBrand.brand_id, brandData);
      addAlert('¡Marca actualizada con éxito!', 'success');
    } else {
      await brandApi.create(token, brandData);
      addAlert('¡Marca creada con éxito!', 'success');
    }
    fetchBrands();
    handleCloseModal();
  };

  const handleOpenAlert = (brand: Brand) => {
    setBrandToDelete(brand);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (brandToDelete) {
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        return;
      }
      try {
        await brandApi.delete(token, brandToDelete.brand_id);
        addAlert('Marca eliminada con éxito.', 'success');
        fetchBrands();
      } catch (error) {
        // Error al eliminar marca - manejado por el sistema de alertas
        addAlert('Error al eliminar la marca.', 'error');
      } finally {
        setIsAlertOpen(false);
        setBrandToDelete(null);
      }
    }
  };

  const columns: Column<Brand>[] = useMemo(
    () => [
      { header: 'ID', accessor: 'brand_id' },
      { header: 'Nombre', accessor: 'brand_name' },
      {
        header: 'Última Actualización',
        accessor: (item) => new Date(item.updated_at).toLocaleDateString(),
      },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<Brand>(columns, 'brands-table');

  return (
    <AnimatedWrapper>
      <Header
        title="Marcas"
        description="Administra las marcas de los productos."
        buttonText="Agregar Marca"
        onButtonClick={() => handleOpenModal()}
      />
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <Input
              placeholder="Buscar marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          )}
        >
          <CardTitle>Todas las Marcas</CardTitle>
          <CardDescription>
            Mostrando {filteredBrands.length} de {brands.length} marcas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando marcas...</p>
          ) : (
            <Table
              columns={orderedColumns}
              data={filteredBrands}
              onEdit={handleOpenModal}
              onDelete={handleOpenAlert}
              getKey={(b) => b.brand_id}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Editar Marca' : 'Agregar Nueva Marca'}</DialogTitle>
          </DialogHeader>
          <BrandForm brand={editingBrand} onSave={handleSave} onCancel={handleCloseModal} />
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente la marca "{brandToDelete?.brand_name}".
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

export default Brands;
