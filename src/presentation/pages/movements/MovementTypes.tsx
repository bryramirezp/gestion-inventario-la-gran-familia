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
import { movementTypeApi } from '@/data/api';
import { MovementType, NewMovementType, MovementCategory } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Label, Input, Textarea, Select, FormError } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useForm } from '@/infrastructure/hooks/useForm';
import useTableState from '@/infrastructure/hooks/useTableState';
import { TagIcon } from '@/presentation/components/icons/Icons';
import { useAuth } from '@/app/providers/AuthProvider';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

const MovementTypeForm: React.FC<{
  movementType: Partial<NewMovementType> | null;
  onSave: (movementType: NewMovementType) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}> = ({ movementType, onSave, onCancel, isSubmitting = false }) => {
  const isEditing = !!movementType?.type_id;

  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<NewMovementType>(
    (movementType || {
      type_code: '',
      type_name: '',
      category: 'ENTRADA',
      description: '',
      is_active: true,
    }) as NewMovementType,
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.type_code?.trim()) {
        tempErrors.type_code = 'El código del tipo es requerido.';
      }
      if (!formData.type_name?.trim()) {
        tempErrors.type_name = 'El nombre del tipo es requerido.';
      }
      if (!formData.category) {
        tempErrors.category = 'La categoría es requerida.';
      }
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave(values);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Error inesperado' });
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-muted dark:bg-dark-muted">
            <TagIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-grow w-full space-y-4">
            <div>
              <Label htmlFor="type_code">Código del Tipo</Label>
              <Input
                id="type_code"
                name="type_code"
                value={values.type_code || ''}
                onChange={handleChange}
                required
                error={!!errors.type_code}
                placeholder="ej. CONSUMO, MERMA, etc."
                disabled={isEditing}
              />
              <FormError message={errors.type_code} />
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  El código no se puede modificar después de crear el tipo.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="type_name">Nombre del Tipo</Label>
              <Input
                id="type_name"
                name="type_name"
                value={values.type_name || ''}
                onChange={handleChange}
                required
                error={!!errors.type_name}
                placeholder="ej. Consumo Interno"
              />
              <FormError message={errors.type_name} />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select
                id="category"
                name="category"
                value={values.category || 'ENTRADA'}
                onChange={handleChange}
                required
                error={!!errors.category}
                disabled={isEditing}
              >
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
                <option value="TRASPASO">TRASPASO</option>
                <option value="AJUSTE">AJUSTE</option>
              </Select>
              <FormError message={errors.category} />
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  La categoría no se puede modificar después de crear el tipo.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={values.description || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Descripción del tipo de movimiento"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={values.is_active ?? true}
                onChange={(e) => handleChange({ target: { name: 'is_active', value: e.target.checked } } as any)}
                className="rounded"
              />
              <Label htmlFor="is_active" className="font-normal cursor-pointer">
                Activo
              </Label>
            </div>
          </div>
        </div>
        <FormError message={errors.form} className="text-center" />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const MovementTypes: React.FC = () => {
  const { addAlert } = useAlerts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<MovementType | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<MovementType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: movementTypes = [], isLoading: typesLoading } = useApiQuery<MovementType[]>(
    ['movementTypes'],
    (token) => movementTypeApi.getAll(token),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const saveTypeMutation = useApiMutation<MovementType, { typeId?: number; data: NewMovementType }>(
    async ({ typeId, data }, token) => {
      if (typeId) {
        return (await movementTypeApi.update(token, typeId, data)) as MovementType;
      } else {
        return await movementTypeApi.create(token, data);
      }
    },
    {
      onSuccess: (data, variables) => {
        if (variables.typeId) {
          addAlert('¡Tipo de movimiento actualizado con éxito!', 'success');
        } else {
          addAlert('¡Tipo de movimiento creado con éxito!', 'success');
        }
        setIsModalOpen(false);
        setEditingType(null);
      },
      onError: (error) => {
        addAlert(`Error al guardar tipo: ${error.message}`, 'error');
      },
      invalidateQueries: [['movementTypes']],
    }
  );

  const deleteTypeMutation = useApiMutation<boolean, number>(
    async (typeId, token) => {
      return await movementTypeApi.delete(token, typeId);
    },
    {
      onSuccess: () => {
        addAlert('¡Tipo de movimiento eliminado con éxito!', 'success');
        setIsAlertOpen(false);
        setTypeToDelete(null);
      },
      onError: (error) => {
        addAlert(`Error al eliminar tipo: ${error.message}`, 'error');
      },
      invalidateQueries: [['movementTypes']],
    }
  );

  const handleOpenModal = (type: MovementType | null = null) => {
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingType(null);
    setIsModalOpen(false);
  };

  const handleSave = async (typeData: NewMovementType) => {
    try {
      await saveTypeMutation.mutateAsync({
        typeId: editingType?.type_id,
        data: typeData,
      });
    } catch (error) {
      throw error;
    }
  };

  const handleOpenAlert = (type: MovementType) => {
    setTypeToDelete(type);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    try {
      await deleteTypeMutation.mutateAsync(typeToDelete.type_id);
    } catch (error) {
      // Error ya manejado en onError del mutation
    }
  };

  const filteredTypes = useMemo(() => {
    let filtered = movementTypes;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.type_code.toLowerCase().includes(searchLower) ||
          t.type_name.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    return filtered;
  }, [movementTypes, searchTerm, selectedCategory]);

  const columns: Column<MovementType>[] = useMemo(
    () => [
      { header: 'Código', accessor: 'type_code' },
      { header: 'Nombre', accessor: 'type_name' },
      {
        header: 'Categoría',
        accessor: (item) => (
          <Badge
            variant={
              item.category === 'ENTRADA'
                ? 'success'
                : item.category === 'SALIDA'
                ? 'destructive'
                : item.category === 'TRASPASO'
                ? 'secondary'
                : 'warning'
            }
          >
            {item.category}
          </Badge>
        ),
      },
      {
        header: 'Descripción',
        accessor: (item) => item.description || '-',
      },
      {
        header: 'Estado',
        accessor: (item) => (
          <Badge variant={item.is_active ? 'default' : 'secondary'}>
            {item.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
    ],
    []
  );

  const tableState = useTableState(columns);

  return (
    <AnimatedWrapper>
      <Header
        title="Tipos de Movimiento"
        description="Gestión del catálogo de tipos de movimiento de inventario"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tipos de Movimiento</CardTitle>
              <CardDescription>
                Catálogo de tipos de movimiento disponibles. Total: {filteredTypes.length} tipos
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenModal(null)}>
              <TagIcon className="h-4 w-4 mr-2" />
              Crear Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
                <option value="TRASPASO">TRASPASO</option>
                <option value="AJUSTE">AJUSTE</option>
              </Select>
            </div>
          </div>

          {typesLoading ? (
            <LoadingSpinner size="lg" message="Cargando tipos de movimiento..." />
          ) : (
            <ResponsiveTable
              columns={columns}
              data={filteredTypes}
              getKey={(t) => t.type_id.toString()}
              onEdit={handleOpenModal}
              onDelete={handleOpenAlert}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent maxWidth="2xl">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Editar Tipo de Movimiento' : 'Crear Nuevo Tipo de Movimiento'}
            </DialogTitle>
          </DialogHeader>
          <MovementTypeForm
            movementType={editingType}
            onSave={handleSave}
            onCancel={handleCloseModal}
            isSubmitting={saveTypeMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de movimiento "
              {typeToDelete?.type_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)} disabled={deleteTypeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTypeMutation.isPending}
            >
              {deleteTypeMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default MovementTypes;

