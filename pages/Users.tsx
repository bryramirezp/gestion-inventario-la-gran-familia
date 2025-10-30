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
import { userApi, getRoles, warehouseApi } from '../services/api';
// import { supabase } from '../services/supabase';
import { User, Role, Warehouse } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Label, Select, Input, FormError } from '../components/forms';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AnimatedWrapper } from '../components/Animated';
import { useAlerts } from '../contexts/AlertContext';
import { useForm } from '../hooks/useForm';
import useTableState from '../hooks/useTableState';
import { EditIcon, KeyIcon, XCircleIcon, CheckCircleIcon, TrashIcon } from '../components/icons/Icons';
import { useAuth } from '../contexts/AuthContext';

type UserDetail = User & { role_name: string; warehouse_access: number[] };

interface CreateUserFormData {
  email: string;
  password: string;
}

interface EditUserFormData {
  role_id: number;
  warehouse_ids: number[];
}

const CreateUserForm: React.FC<{
  onSave: (data: CreateUserFormData) => Promise<void>;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {

  const { values, errors, handleChange, handleSubmit, setErrors } =
    useForm<CreateUserFormData>(
      {
        email: '',
        password: '',
      },
      (formData) => {
        const tempErrors: Record<string, string> = {};
        if (!formData.email)
          tempErrors.email = 'El email es requerido.';
        if (!formData.password)
          tempErrors.password = 'La contraseña es requerida.';
        if (formData.password && formData.password.length < 6)
          tempErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
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
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              required
              error={!!errors.email}
            />
            <FormError message={errors.email} />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              required
              error={!!errors.password}
            />
            <FormError message={errors.password} />
          </div>
        </div>

        <FormError message={errors.form} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Crear Usuario</Button>
      </DialogFooter>
    </form>
  );
};

const EditUserForm: React.FC<{
  user: UserDetail | null;
  roles: Role[];
  warehouses: Warehouse[];
  onSave: (data: EditUserFormData, userId?: string) => Promise<void>;
  onCancel: () => void;
}> = ({ user, roles, warehouses, onSave, onCancel }) => {
  const isEditing = !!user;

  const { values, errors, handleChange, handleSubmit, setErrors, setValues } =
    useForm<EditUserFormData>(
      {
        role_id: user?.role_id || 0,
        warehouse_ids: user?.warehouse_access || [],
      },
      (formData) => {
        const tempErrors: Record<string, string> = {};
        if (!formData.role_id) tempErrors.role_id = 'Se debe seleccionar un rol.';
        return tempErrors;
      }
    );


  const handleFormSubmit = async () => {
    try {
      await onSave(values, user?.user_id);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <Label htmlFor="role_id">Rol</Label>
            <Select
              id="role_id"
              name="role_id"
              value={values.role_id}
              onChange={handleChange}
              error={!!errors.role_id}
            >
              <option value="">Selecciona un Rol</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </option>
              ))}
            </Select>
            <FormError message={errors.role_id} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="mb-0">Acceso a Almacenes</Label>
            <div className="space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValues((prev) => ({
                  ...prev,
                  warehouse_ids: warehouses.map((wh) => wh.warehouse_id),
                }))}
                className="text-xs"
              >
                Seleccionar Todo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValues((prev) => ({
                  ...prev,
                  warehouse_ids: [],
                }))}
                className="text-xs"
              >
                Deseleccionar Todo
              </Button>
            </div>
          </div>
          <div className="space-y-1 p-3 border border-border rounded-md max-h-48 overflow-y-auto bg-muted/30 dark:bg-dark-muted/30">
            {warehouses.length > 0 ? (
              warehouses.map((wh) => (
                <div
                  key={wh.warehouse_id}
                  className="flex items-center p-1 rounded-md hover:bg-muted dark:hover:bg-dark-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`wh-${wh.warehouse_id}`}
                    checked={values.warehouse_ids.includes(wh.warehouse_id)}
                    onChange={() => setValues((prev) => {
                      const newWarehouseIds = prev.warehouse_ids.includes(wh.warehouse_id)
                        ? prev.warehouse_ids.filter((id) => id !== wh.warehouse_id)
                        : [...prev.warehouse_ids, wh.warehouse_id];
                      return { ...prev, warehouse_ids: newWarehouseIds };
                    })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <Label
                    htmlFor={`wh-${wh.warehouse_id}`}
                    className="ml-3 mb-0 font-normal cursor-pointer flex-grow"
                  >
                    {wh.warehouse_name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">
                No hay almacenes disponibles.
              </p>
            )}
          </div>
        </div>

        <FormError message={errors.form} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Cambios</Button>
      </DialogFooter>
    </form>
  );
};

const PasswordResetForm: React.FC<{
  user: UserDetail;
  onSave: (password: string) => Promise<void>;
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm(
    { newPassword: '', confirmPassword: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.newPassword) {
        tempErrors.newPassword = 'La nueva contraseña es requerida.';
      } else if (formData.newPassword.length < 6) {
        tempErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres.';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Las contraseñas no coinciden.';
      }
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave(values.newPassword);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="newPassword">Nueva Contraseña</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={values.newPassword}
            onChange={handleChange}
            error={!!errors.newPassword}
          />
          <FormError message={errors.newPassword} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
          />
          <FormError message={errors.confirmPassword} />
        </div>
        <FormError message={errors.form} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Establecer Contraseña</Button>
      </DialogFooter>
    </form>
  );
};

const Users: React.FC = () => {
  const { user: currentUser, getToken, signUp } = useAuth();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isToggleAlertOpen, setIsToggleAlertOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserDetail | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDetail | null>(null);
  const { addAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, roleData, warehouseData] = await Promise.all([
        userApi.getAllWithDetails(''),
        getRoles(''),
        warehouseApi.getAll(''),
      ]);
      setUsers(userData);
      setRoles(roleData);
      setWarehouses(warehouseData);
    } catch (error) {
      // Error al cargar datos de usuario - manejado por el sistema de alertas
      addAlert('Error al cargar los datos de usuario.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole ? u.role_id === parseInt(selectedRole) : true;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const handleOpenModal = (user: UserDetail | null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleOpenPasswordModal = (user: UserDetail) => {
    setEditingUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleOpenToggleAlert = (user: UserDetail) => {
    setUserToToggle(user);
    setIsToggleAlertOpen(true);
  };

  const handleOpenDeleteAlert = (user: UserDetail) => {
    setUserToDelete(user);
    setIsDeleteAlertOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
    setIsPasswordModalOpen(false);
  };

  const handleConfirmToggle = async () => {
    if (userToToggle) {
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        return;
      }
      try {
        await userApi.toggleUserStatus(token, userToToggle.user_id);
        addAlert(
          `El usuario ${userToToggle.full_name} ha sido ${userToToggle.is_active ? 'desactivado' : 'activado'}.`,
          'success'
        );
        fetchData();
      } catch (error) {
        // Error al cambiar estado de usuario - manejado por el sistema de alertas
        addAlert('Error al actualizar el estado del usuario.', 'error');
      } finally {
        setIsToggleAlertOpen(false);
        setUserToToggle(null);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        return;
      }
      try {
        await userApi.deleteUser(token, userToDelete.user_id);
        addAlert(`El usuario ${userToDelete.full_name} ha sido eliminado permanentemente.`, 'success');
        fetchData();
      } catch (error) {
        // Error al eliminar usuario - manejado por el sistema de alertas
        addAlert('Error al eliminar el usuario.', 'error');
      } finally {
        setIsDeleteAlertOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const handleCreateUser = async (data: CreateUserFormData) => {
    // Creating new user with Supabase Auth
    const { user, error } = await signUp(data.email, data.password);

    if (error) {
      addAlert(`Error al crear usuario: ${error.message}`, 'error');
      return;
    }

    if (user) {
      addAlert('¡Usuario creado con éxito!', 'success');
    }

    fetchData();
    handleCloseModal();
  };

  const handleEditUser = async (data: EditUserFormData, userId?: string) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }

    if (userId) {
      // Editing existing user's permissions
      await userApi.updateUserAccess(token, userId, data.role_id, data.warehouse_ids);
      addAlert('¡Permisos de usuario actualizados con éxito!', 'success');
    }

    fetchData();
    handleCloseModal();
  };

  const handlePasswordSave = async (password: string) => {
    if (!editingUser) return;
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    await userApi.updateUserPassword(token, editingUser.user_id, password);
    addAlert(`La contraseña para ${editingUser.full_name} ha sido actualizada.`, 'success');
    handleCloseModal();
  };

  const warehouseMap = new Map(warehouses.map((w) => [w.warehouse_id, w.warehouse_name]));

  const columns: Column<UserDetail>[] = useMemo(
    () => [
      { header: 'Nombre', accessor: 'full_name' },
      { header: 'Rol', accessor: (item) => <Badge>{item.role_name}</Badge> },
      {
        header: 'Acceso a Almacén',
        accessor: (item) =>
          item.warehouse_access.map((id) => warehouseMap.get(id) || 'N/A').join(', '),
      },
      {
        header: 'Estado',
        accessor: (item) =>
          item.is_active ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          ),
      },
      {
        header: 'Acciones',
        accessor: (item) => {
          const isCurrentUser = item.user_id === currentUser?.id;
          const toggleIcon = item.is_active ? (
            <XCircleIcon className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-success" />
          );
          const toggleTitle = item.is_active ? 'Desactivar Usuario' : 'Activar Usuario';

          return (
            <div className="flex items-center justify-end space-x-1">
              <Button
                variant="ghost"
                size="icon"
                title="Editar Permisos"
                onClick={() => handleOpenModal(item)}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Restablecer Contraseña"
                onClick={() => handleOpenPasswordModal(item)}
              >
                <KeyIcon className="h-4 w-4" />
              </Button>
              {item.user_id !== currentUser?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Eliminar Usuario"
                  onClick={() => handleOpenDeleteAlert(item)}
                >
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </Button>
              )}
              {!isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  title={toggleTitle}
                  onClick={() => handleOpenToggleAlert(item)}
                >
                  {toggleIcon}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUser]
  );

  const { orderedColumns, ...tableState } = useTableState<UserDetail>(columns, 'users-table');

  return (
    <AnimatedWrapper>
      <Header
        title="Usuarios"
        description="Administra los usuarios y sus permisos."
        buttonText="Agregar Usuario"
        onButtonClick={() => handleOpenModal(null)}
      />
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Todos los Roles</option>
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        >
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>
            Mostrando {filteredUsers.length} de {users.length} usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando usuarios...</p>
          ) : (
            <Table
              columns={orderedColumns}
              data={filteredUsers}
              getKey={(u) => u.user_id}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Permisos de Usuario' : 'Crear Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>
          {editingUser ? (
            <EditUserForm
              user={editingUser}
              roles={roles}
              warehouses={warehouses}
              onSave={handleEditUser}
              onCancel={handleCloseModal}
            />
          ) : (
            <CreateUserForm
              onSave={handleCreateUser}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog isOpen={isPasswordModalOpen} onClose={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña para {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <PasswordResetForm
              user={editingUser}
              onSave={handlePasswordSave}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={isToggleAlertOpen} onClose={() => setIsToggleAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto {userToToggle?.is_active ? 'desactivará' : 'activará'} la cuenta de "
              {userToToggle?.full_name}".{' '}
              {userToToggle?.is_active
                ? 'No podrán iniciar sesión.'
                : 'Podrán volver a iniciar sesión.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsToggleAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>
              Sí, {userToToggle?.is_active ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog isOpen={isDeleteAlertOpen} onClose={() => setIsDeleteAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario "
              {userToDelete?.full_name}" y toda su información asociada, incluyendo su cuenta de autenticación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default Users;
