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
import { categoryApi } from '../services/api';
import { Category, NewCategory } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Label, Input, FormError } from '../components/forms';
import { Button } from '../components/Button';
import { AnimatedWrapper } from '../components/Animated';
import { useAlerts } from '../contexts/AlertContext';
import { useForm } from '../hooks/useForm';
import useTableState from '../hooks/useTableState';
import { ArchiveBoxIcon } from '../components/icons/Icons';
import { useAuth } from '../contexts/AuthContext';

const CategoryForm: React.FC<{
  category: Partial<NewCategory> | null;
  onSave: (category: NewCategory) => Promise<void>;
  onCancel: () => void;
}> = ({ category, onSave, onCancel }) => {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<NewCategory>(
    (category || { category_name: '' }) as NewCategory,
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.category_name)
        tempErrors.category_name = 'El nombre de la categoría es requerido.';
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
            <ArchiveBoxIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-grow w-full">
            <Label htmlFor="category_name">Nombre de la Categoría</Label>
            <Input
              id="category_name"
              name="category_name"
              value={values.category_name || ''}
              onChange={handleChange}
              required
              error={!!errors.category_name}
              placeholder="ej. Alimentos"
            />
            <FormError message={errors.category_name} />
          </div>
        </div>
        <FormError message={errors.form} className="mt-4 text-center" />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Categoría</Button>
      </DialogFooter>
    </form>
  );
};

const Categories: React.FC = () => {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { addAlert } = useAlerts();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll('');
      setCategories(data);
    } catch (error) {
      // Error al cargar categorías - manejado por el sistema de alertas
      addAlert('Error al cargar las categorías.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) => c.category_name.toLowerCase().includes(searchTerm.toLowerCase()) && c.is_active // Solo mostrar categorías activas
    );
  }, [categories, searchTerm]);

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCategory(null);
    setIsModalOpen(false);
  };

  const handleSave = async (categoryData: NewCategory) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    if (editingCategory) {
      await categoryApi.update(token, editingCategory.category_id, categoryData);
      addAlert('¡Categoría actualizada con éxito!', 'success');
    } else {
      await categoryApi.create(token, categoryData);
      addAlert('¡Categoría creada con éxito!', 'success');
    }
    fetchCategories();
    handleCloseModal();
  };

  const handleOpenAlert = (category: Category) => {
    setCategoryToDelete(category);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        // Cambiar a eliminación lógica en lugar de eliminación física
        const token = getToken();
        if (!token) {
          addAlert('No se pudo obtener el token de autenticación.', 'error');
          return;
        }
        await categoryApi.update(token, categoryToDelete.category_id, { is_active: false });
        addAlert('Categoría desactivada con éxito.', 'success');
        fetchCategories();
      } catch (error) {
        // Error al desactivar categoría - manejado por el sistema de alertas
        addAlert('Error al desactivar la categoría.', 'error');
      } finally {
        setIsAlertOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  const columns: Column<Category>[] = useMemo(
    () => [
      { header: 'ID', accessor: 'category_id' },
      { header: 'Nombre', accessor: 'category_name' },
      {
        header: 'Estado',
        accessor: (item) => (item.is_active ? 'Activa' : 'Inactiva'),
      },
      {
        header: 'Última Actualización',
        accessor: (item) => new Date(item.updated_at).toLocaleDateString(),
      },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<Category>(columns, 'categories-table');

  return (
    <AnimatedWrapper>
      <Header
        title="Categorías"
        description="Agrupa tus productos en categorías."
        buttonText="Agregar Categoría"
        onButtonClick={() => handleOpenModal()}
      />
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          )}
        >
          <CardTitle>Todas las Categorías</CardTitle>
          <CardDescription>
            Mostrando {filteredCategories.length} de {categories.length} categorías.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando categorías...</p>
          ) : (
            <Table
              columns={orderedColumns}
              data={filteredCategories}
              onEdit={handleOpenModal}
              onDelete={handleOpenAlert}
              getKey={(c) => c.category_id}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
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
              Esto desactivará la categoría "{categoryToDelete?.category_name}". La categoría ya no
              estará disponible pero se mantendrá en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default Categories;
