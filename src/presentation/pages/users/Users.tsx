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
import { userApi, getRoles, warehouseApi } from '@/data/api';
import { validatePassword } from '@/data/validation';
import { User, Role, Warehouse } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Label, Select, Input, FormError } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useForm } from '@/infrastructure/hooks/useForm';
import useTableState from '@/infrastructure/hooks/useTableState';
import { EditIcon, KeyIcon, XCircleIcon, CheckCircleIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@/presentation/components/icons/Icons';
import { useAuth } from '@/app/providers/AuthProvider';

type UserDetail = User & { role_name: string; warehouse_access: number[] };

interface CreateUserFormData {
  email: string;
  password: string;
}

interface EditUserFormData {
  full_name: string;
  role_id: number;
  warehouse_ids: number[];
}

const CreateUserForm: React.FC<{
  onSave: (data: CreateUserFormData) => Promise<void>;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);

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
        if (!formData.password) {
          tempErrors.password = 'La contraseña es requerida.';
        } else {
          const passwordValidation = validatePassword(formData.password);
          if (!passwordValidation.isValid) {
            tempErrors.password = passwordValidation.error || 'La contraseña no cumple con los requisitos.';
          }
        }
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
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              required
              error={!!errors.email}
              placeholder="usuario@ejemplo.com"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            <FormError message={errors.email} id="email-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange}
                required
                error={!!errors.password}
                placeholder="Mínimo 8 caracteres con dígitos, mayúsculas, minúsculas y símbolos"
                aria-describedby={errors.password ? 'password-error' : 'password-help'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            <FormError message={errors.password} id="password-error" />
            <p id="password-help" className="text-xs text-muted-foreground mt-1">
              La contraseña debe tener mínimo 8 caracteres e incluir: dígitos, letras minúsculas, letras mayúsculas y símbolos.
            </p>
          </div>
        </div>

        {errors.form && (
          <div className="pt-2">
            <FormError message={errors.form} />
          </div>
        )}
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
        full_name: user?.full_name || '',
        role_id: user?.role_id || 0,
        warehouse_ids: user?.warehouse_access || [],
      },
      (formData) => {
        const tempErrors: Record<string, string> = {};
        if (!formData.full_name || formData.full_name.trim() === '') {
          tempErrors.full_name = 'El nombre es requerido.';
        }
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
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nombre Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              value={values.full_name}
              onChange={handleChange}
              required
              error={!!errors.full_name}
              placeholder="Ingresa el nombre completo"
              aria-describedby={errors.full_name ? 'full_name-error' : undefined}
            />
            <FormError message={errors.full_name} id="full_name-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_id">
              Rol <span className="text-destructive">*</span>
            </Label>
            <Select
              id="role_id"
              name="role_id"
              value={values.role_id}
              onChange={handleChange}
              error={!!errors.role_id}
              aria-describedby={errors.role_id ? 'role_id-error' : undefined}
            >
              <option value="">Selecciona un Rol</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </option>
              ))}
            </Select>
            <FormError message={errors.role_id} id="role_id-error" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="mb-0">
              Acceso a Almacenes
              <span className="text-xs font-normal text-muted-foreground ml-2">(Opcional)</span>
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValues((prev) => ({
                  ...prev,
                  warehouse_ids: warehouses.map((wh) => wh.warehouse_id),
                }))}
                className="text-xs h-7 px-2"
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
                className="text-xs h-7 px-2"
              >
                Deseleccionar Todo
              </Button>
            </div>
          </div>
          <div className="space-y-2 p-4 border border-border rounded-md max-h-48 overflow-y-auto bg-muted/30 dark:bg-dark-muted/30">
            {warehouses.length > 0 ? (
              warehouses.map((wh) => {
                const isChecked = values.warehouse_ids.includes(wh.warehouse_id);
                const handleToggle = (e: React.MouseEvent | React.ChangeEvent) => {
                  e.stopPropagation();
                  setValues((prev) => {
                    const newWarehouseIds = isChecked
                      ? prev.warehouse_ids.filter((id) => id !== wh.warehouse_id)
                      : [...prev.warehouse_ids, wh.warehouse_id];
                    return { ...prev, warehouse_ids: newWarehouseIds };
                  });
                };
                return (
                  <label
                    key={wh.warehouse_id}
                    htmlFor={`wh-${wh.warehouse_id}`}
                    className="flex items-center p-2 rounded-md hover:bg-background dark:hover:bg-dark-card transition-colors cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      id={`wh-${wh.warehouse_id}`}
                      checked={isChecked}
                      onChange={handleToggle}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-colors"
                    />
                    <span className="ml-3 font-normal flex-grow select-none">
                      {wh.warehouse_name}
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">
                No hay almacenes disponibles.
              </p>
            )}
          </div>
        </div>

        {errors.form && (
          <div className="pt-2">
            <FormError message={errors.form} />
          </div>
        )}
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm(
    { newPassword: '', confirmPassword: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.newPassword) {
        tempErrors.newPassword = 'La nueva contraseña es requerida.';
      } else {
        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
          tempErrors.newPassword = passwordValidation.error || 'La contraseña no cumple con los requisitos.';
        }
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
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              Nueva Contraseña <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={values.newPassword}
                onChange={handleChange}
                error={!!errors.newPassword}
                placeholder="Mínimo 8 caracteres con dígitos, mayúsculas, minúsculas y símbolos"
                aria-describedby={errors.newPassword ? 'newPassword-error' : 'newPassword-help'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showNewPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            <FormError message={errors.newPassword} id="newPassword-error" />
            <p id="newPassword-help" className="text-xs text-muted-foreground mt-1">
              La contraseña debe tener mínimo 8 caracteres e incluir: dígitos, letras minúsculas, letras mayúsculas y símbolos.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirmar Nueva Contraseña <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                placeholder="Confirma la contraseña"
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            <FormError message={errors.confirmPassword} id="confirmPassword-error" />
          </div>
        </div>

        {errors.form && (
          <div className="pt-2">
            <FormError message={errors.form} />
          </div>
        )}
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
      // Manejar full_name null o undefined
      const fullName = u.full_name || '';
      const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase());
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
          `El usuario ${userToToggle.full_name || 'Sin nombre'} ha sido ${userToToggle.is_active ? 'desactivado' : 'activado'}.`,
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
        addAlert(`El usuario ${userToDelete.full_name || 'Sin nombre'} ha sido eliminado permanentemente.`, 'success');
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
    try {
      // Creating new user with Supabase Auth
      const { user, error } = await signUp(data.email, data.password);

      if (error) {
        addAlert(`Error al crear usuario: ${error.message}`, 'error');
        return;
      }

      if (user) {
        // Verificar si el usuario necesita confirmar su email
        if (!user.email_confirmed_at) {
          addAlert(
            `¡Usuario creado con éxito! Se ha enviado un correo de confirmación a ${data.email}. El usuario debe verificar su correo antes de poder iniciar sesión.`,
            'success'
          );
        } else {
          addAlert('¡Usuario creado con éxito!', 'success');
        }
      }

      fetchData();
      handleCloseModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario';
      addAlert(`Error al crear usuario: ${errorMessage}`, 'error');
    }
  };

  const handleEditUser = async (data: EditUserFormData, userId?: string) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }

    if (userId) {
      // Editing existing user's name, role and permissions
      await userApi.updateUserAccess(token, userId, data.full_name, data.role_id, data.warehouse_ids);
      addAlert('¡Datos de usuario actualizados con éxito!', 'success');
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
    try {
      await userApi.updateUserPassword(token, editingUser.user_id, password);
      addAlert(`La contraseña para ${editingUser.full_name || 'el usuario'} ha sido actualizada exitosamente.`, 'success');
      handleCloseModal();
    } catch (error: any) {
      addAlert(error.message || 'Error al actualizar la contraseña.', 'error');
    }
  };

  const columns: Column<UserDetail>[] = useMemo(() => {
    const warehouseMap = new Map(warehouses.map((w) => [w.warehouse_id, w.warehouse_name]));
    
    return [
      { 
        header: 'Nombre', 
        accessor: (item) => item.full_name || 'Sin nombre' 
      },
      { header: 'Rol', accessor: (item) => <Badge>{item.role_name}</Badge> },
      {
        header: 'Acceso a Almacén',
        accessor: (item) => {
          if (!item.warehouse_access || item.warehouse_access.length === 0) {
            return <span className="text-muted-foreground">Sin almacenes asignados</span>;
          }
          const warehouseNames = item.warehouse_access
            .map((id) => warehouseMap.get(id))
            .filter((name): name is string => !!name);
          return warehouseNames.length > 0 
            ? warehouseNames.join(', ') 
            : <span className="text-muted-foreground">Almacenes no encontrados</span>;
        },
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
    ];
  }, [currentUser, warehouses]);

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
            <ResponsiveTable
              columns={orderedColumns}
              data={filteredUsers}
              getKey={(u) => u.user_id}
              renderMobileCard={(user) => (
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{user.full_name || 'Sin nombre'}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Rol: {user.role_name}</div>
                    <div>Almacenes: {user.warehouse_access?.length || 0}</div>
                    <div className="text-xs">
                      Estado: {user.is_active ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                </div>
              )}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </DialogTitle>
            {editingUser ? (
              <p className="text-sm text-muted-foreground mt-1">
                Actualiza la información del usuario y sus permisos.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Crea un nuevo usuario con email y contraseña. Se enviará un correo de confirmación.
              </p>
            )}
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
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña para {editingUser?.full_name || 'Usuario'}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Establece una nueva contraseña para este usuario.
            </p>
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
              {userToToggle?.full_name || 'Sin nombre'}".{' '}
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
              {userToDelete?.full_name || 'Sin nombre'}" y toda su información asociada, incluyendo su cuenta de autenticación.
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
