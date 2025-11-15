import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/forms';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { donationApi, donorApi, productApi, warehouseApi, getDonorTypes } from '@/data/api';
import { Donor, Product, Warehouse, Donation, DonorType, NewDonor, NewDonation, StockLot, DonationItem } from '@/domain/types';
import { stockLotApi } from '@/data/api/warehouse.api';
import {
  CalendarIcon,
  CubeIcon,
  BuildingStorefrontIcon,
} from '@/presentation/components/icons/Icons';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { useAlerts } from '@/app/providers/AlertProvider';
import CreatableCombobox from '@/presentation/features/shared/CreatableCombobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/presentation/components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/presentation/components/ui/AlertDialog';
import { Badge } from '@/presentation/components/ui/Badge';
import DonorForm from '@/presentation/features/donations/DonorForm';
import DonationForm from '@/presentation/features/donations/DonationForm';
import Pagination from '@/presentation/components/ui/Pagination';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import { Label } from '@/presentation/components/forms';
import { DatePicker } from '@/presentation/features/shared/DatePicker';
import { PencilIcon, CheckIcon, XMarkIcon, TrashIcon } from '@/presentation/components/icons/Icons';
import { validateNumericInput } from '@/infrastructure/utils/validation.util';

type DonationItem = Donation['items'][0];

const DonationItemsModal: React.FC<{ donation: Donation; onClose: () => void }> = ({
  donation,
  onClose,
}) => {
  const { addAlert } = useAlerts();
  const [lotToDelete, setLotToDelete] = useState<{ lot: StockLot; item: DonationItem } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<{
    quantity: number;
    market_unit_price: number;
    actual_unit_price: number;
    expiry_date: string | null;
  } | null>(null);

  const toggleItemExpansion = (itemId: number | undefined) => {
    if (!itemId) return;
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const startEditing = (item: DonationItem) => {
    if (!item.item_id) return;
    setEditingItemId(item.item_id);
    setEditingValues({
      quantity: item.quantity || item.current_quantity || 0,
      market_unit_price: item.market_unit_price || 0,
      actual_unit_price: item.actual_unit_price || 0,
      expiry_date: item.expiry_date || null,
    });
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingValues(null);
  };

  const updateDonationItemMutation = useApiMutation<
    DonationItem,
    { itemId: number; updates: { quantity?: number; market_unit_price?: number; actual_unit_price?: number; expiry_date?: string | null } }
  >(
    async ({ itemId, updates }, token) => {
      return await donationApi.updateDonationItem(token, itemId, updates);
    },
    {
      onSuccess: (updatedItem) => {
        // Actualizar estado local con el item actualizado
        setLocalDonation((prevDonation) => {
          const updatedItems = prevDonation.items.map((item) => {
            if (item.item_id === updatedItem.item_id) {
              return {
                ...item,
                quantity: updatedItem.quantity,
                market_unit_price: updatedItem.market_unit_price,
                actual_unit_price: updatedItem.actual_unit_price,
                expiry_date: updatedItem.expiry_date,
                current_quantity: updatedItem.quantity,
              };
            }
            return item;
          });
          
          // Recalcular totales
          const total_market_value = updatedItems.reduce(
            (acc, item) => acc + (item.market_unit_price || 0) * Number(item.current_quantity || 0),
            0
          );
          const total_actual_value = updatedItems.reduce(
            (acc, item) => acc + (item.actual_unit_price || 0) * Number(item.current_quantity || 0),
            0
          );

          return {
            ...prevDonation,
            items: updatedItems,
            total_market_value,
            total_actual_value,
          };
        });
        addAlert('Item de donación actualizado con éxito.', 'success');
        setEditingItemId(null);
        setEditingValues(null);
      },
      onError: (error) => {
        addAlert(`Error al actualizar item: ${error.message}`, 'error');
      },
      invalidateQueries: [['donations']],
    }
  );

  const handleSaveEdit = async () => {
    if (!editingItemId || !editingValues) return;

    try {
      await updateDonationItemMutation.mutateAsync({
        itemId: editingItemId,
        updates: editingValues,
      });
    } catch (error) {
      // Error ya manejado en onError del mutation
    }
  };

  const deleteLotMutation = useApiMutation<boolean, number>(
    async (lotId, token) => {
      return await stockLotApi.delete(token, lotId);
    },
    {
      onSuccess: (_, lotId) => {
        // Actualizar estado local: remover el lote eliminado de la donación
        setLocalDonation((prevDonation) => {
          const updatedItems = prevDonation.items.map((item) => {
            if (item.stock_lots) {
              const updatedLots = item.stock_lots.filter((lot) => lot.lot_id !== lotId);
              return { ...item, stock_lots: updatedLots };
            }
            return item;
          });
          return { ...prevDonation, items: updatedItems };
        });
        addAlert('Lote eliminado con éxito.', 'success');
        setLotToDelete(null);
      },
      onError: (error) => {
        addAlert(`Error al eliminar el lote: ${error.message}`, 'error');
      },
      invalidateQueries: [
        ['donations'], // Invalidar todas las queries de donaciones para refrescar los datos
      ],
    }
  );

  const handleConfirmDelete = async () => {
    if (lotToDelete) {
      try {
        await deleteLotMutation.mutateAsync(lotToDelete.lot.lot_id);
      } catch (error) {
        // Error ya manejado en onError del mutation
      }
    }
  };

  // Estado local para la donación (se actualiza cuando se eliminan lotes o se editan items)
  const [localDonation, setLocalDonation] = useState<Donation>(donation);

  // Sincronizar estado local cuando cambia la prop donation
  useEffect(() => {
    setLocalDonation(donation);
  }, [donation]);

  return (
    <>
      <Dialog isOpen={true} onClose={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Artículos en la Donación #{localDonation.donation_id}</DialogTitle>
            <DialogDescription>
              De {localDonation.donor_name} para {localDonation.warehouse_name} el{' '}
              {new Date(localDonation.donation_date).toLocaleDateString()}.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {localDonation.items.map((item) => {
                const isExpanded = item.item_id ? expandedItems.has(item.item_id) : false;
                const isEditing = item.item_id === editingItemId;
                const lotCount = item.stock_lots?.length || 0;
                const total = isEditing && editingValues
                  ? Number(editingValues.quantity) * editingValues.actual_unit_price
                  : Number(item.current_quantity) * item.actual_unit_price;

                return (
                  <Card key={item.item_id || item.product_id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-lg">{item.product_name || 'Unknown Product'}</div>
                            {!isEditing ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(item)}
                                className="h-8 w-8 p-1 flex items-center justify-center"
                              >
                                <PencilIcon className="h-full w-full" />
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={updateDonationItemMutation.isPending}
                                  className="h-8 w-8 p-1 text-green-600 hover:text-green-700 flex items-center justify-center"
                                >
                                  <CheckIcon className="h-full w-full" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditing}
                                  disabled={updateDonationItemMutation.isPending}
                                  className="h-8 w-8 p-1 text-red-600 hover:text-red-700 flex items-center justify-center"
                                >
                                  <XMarkIcon className="h-full w-full" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {isEditing && editingValues ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <Label className="text-xs">Cantidad *</Label>
                                  <Input
                                    type="number"
                                    value={editingValues.quantity}
                                    onChange={(e) => {
                                      const validation = validateNumericInput(e.target.value, {
                                        min: 1,
                                        max: 1000000,
                                        allowZero: false,
                                        allowNegative: false,
                                        defaultValue: 1,
                                      });
                                      if (validation.isValid) {
                                        setEditingValues({
                                          ...editingValues,
                                          quantity: validation.value,
                                        });
                                      }
                                    }}
                                    min="1"
                                    max="1000000"
                                    step="1"
                                    className="h-8 text-sm"
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Precio Mercado *</Label>
                                  <Input
                                    type="number"
                                    value={editingValues.market_unit_price}
                                    onChange={(e) => {
                                      const validation = validateNumericInput(e.target.value, {
                                        min: 0,
                                        max: 1000000000,
                                        allowZero: true,
                                        allowNegative: false,
                                        defaultValue: 0,
                                      });
                                      if (validation.isValid) {
                                        setEditingValues({
                                          ...editingValues,
                                          market_unit_price: validation.value,
                                        });
                                      }
                                    }}
                                    min="0"
                                    max="1000000000"
                                    step="0.01"
                                    className="h-8 text-sm"
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Precio Real *</Label>
                                  <Input
                                    type="number"
                                    value={editingValues.actual_unit_price}
                                    onChange={(e) => {
                                      const validation = validateNumericInput(e.target.value, {
                                        min: 0,
                                        max: 1000000000,
                                        allowZero: true,
                                        allowNegative: false,
                                        defaultValue: 0,
                                      });
                                      if (validation.isValid) {
                                        setEditingValues({
                                          ...editingValues,
                                          actual_unit_price: validation.value,
                                        });
                                      }
                                    }}
                                    min="0"
                                    max="1000000000"
                                    step="0.01"
                                    className="h-8 text-sm"
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Total</Label>
                                  <div className="h-8 flex items-center text-sm font-semibold text-foreground">
                                    ${total.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Fecha de Caducidad</Label>
                                <DatePicker
                                  selectedDate={editingValues.expiry_date}
                                  onSelectDate={(date) =>
                                    setEditingValues({
                                      ...editingValues,
                                      expiry_date: date,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Cantidad:</span> {item.current_quantity}
                              </div>
                              <div>
                                <span className="font-medium">Precio Mercado:</span> ${item.market_unit_price.toFixed(2)}
                              </div>
                              <div>
                                <span className="font-medium">Precio Real:</span> ${item.actual_unit_price.toFixed(2)}
                              </div>
                              <div>
                                <span className="font-medium">Total:</span>{' '}
                                <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
                              </div>
                              {item.expiry_date && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className="font-medium">Fecha de Caducidad:</span>{' '}
                                  {new Date(item.expiry_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}

                          {lotCount > 0 && (
                            <div className="mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItemExpansion(item.item_id)}
                                className="h-auto p-1 text-xs"
                              >
                                {isExpanded ? 'Ocultar' : 'Mostrar'} {lotCount} lote{lotCount !== 1 ? 's' : ''}
                              </Button>

                              {isExpanded && (
                                <div className="mt-3 border-t pt-3 space-y-2">
                                  <div className="text-sm font-medium text-muted-foreground mb-2">Lotes de Stock:</div>
                                  {item.stock_lots?.map((lot) => (
                                    <div
                                      key={lot.lot_id}
                                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md gap-2"
                                    >
                                      <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <span className="font-medium">ID:</span> {lot.lot_id}
                                        </div>
                                        <div>
                                          <span className="font-medium">Cantidad:</span> {lot.current_quantity}
                                        </div>
                                        <div>
                                          <span className="font-medium">Recibido:</span>{' '}
                                          {new Date(lot.received_date).toLocaleDateString()}
                                        </div>
                                        <div>
                                          <span className="font-medium">Caducidad:</span>{' '}
                                          {lot.expiry_date ? (
                                            <span
                                              className={
                                                new Date(lot.expiry_date) < new Date()
                                                  ? 'text-destructive font-semibold'
                                                  : ''
                                              }
                                            >
                                              {new Date(lot.expiry_date).toLocaleDateString()}
                                            </span>
                                          ) : (
                                            <Badge variant="secondary">N/A</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setLotToDelete({ lot, item })}
                                        disabled={deleteLotMutation.isPending}
                                        className="ml-2"
                                      >
                                        Eliminar
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {lotCount === 0 && (
                            <div className="mt-2">
                              <Badge variant="secondary">No hay lotes asociados a este item</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={lotToDelete !== null} onClose={() => setLotToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el lote #{lotToDelete?.lot.lot_id} del
              producto "{lotToDelete?.item.product_name}". El item de donación no se eliminará, solo el lote de stock
              asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLotToDelete(null)} disabled={deleteLotMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLotMutation.isPending}
            >
              {deleteLotMutation.isPending ? 'Eliminando...' : 'Eliminar Lote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface DonationHistoryCardProps {
  donation: Donation;
  onViewClick: () => void;
  onDeleteClick: () => void;
  isDeleting?: boolean;
}
const DonationHistoryCard: React.FC<DonationHistoryCardProps> = React.memo(
  ({ donation, onViewClick, onDeleteClick, isDeleting = false }) => (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 hover:border-primary transition-all duration-200">
      {/* Sección Izquierda: Perfil y Total Donado */}
      <div className="flex-grow space-y-2 min-w-0">
        <div>
          <CardTitle className="text-base sm:text-lg">{donation.donor_name}</CardTitle>
          <CardDescription className="text-sm">Donación #{donation.donation_id}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Para: {donation.warehouse_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Fecha: {new Date(donation.donation_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Sección Derecha: Estadísticas y Botones */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
        <div className="text-right flex-grow sm:flex-grow-0">
          <p className="font-bold text-base sm:text-lg text-foreground">
            ${donation.total_market_value?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground">{donation.items.length} artículos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onViewClick} className="flex-shrink-0" size="sm" disabled={isDeleting}>
            Ver Artículos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteClick}
            disabled={isDeleting}
            className="flex-shrink-0 h-8 w-8 p-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
);

interface DonationItemForm {
  product_id: number | null;
  quantity: number;
  expiry_date: string | null;
  market_unit_price: number;
  actual_unit_price: number;
}

const ITEMS_PER_PAGE_HISTORY = 6;

const Donations: React.FC = () => {
  const { addAlert } = useAlerts();

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null);

  // Construir filtros para la query optimizada
  const historyFilters = useMemo(() => {
    const filters: {
      limit?: number;
      offset?: number;
      orderBy?: 'donation_date' | 'donation_id' | 'total_actual_value';
      orderDirection?: 'asc' | 'desc';
      search?: string;
    } = {
      limit: ITEMS_PER_PAGE_HISTORY,
      offset: (currentPage - 1) * ITEMS_PER_PAGE_HISTORY,
      orderBy: 'donation_date',
      orderDirection: 'desc',
    };

    if (historySearchTerm) {
      filters.search = historySearchTerm;
    }

    return filters;
  }, [currentPage, historySearchTerm]);

  // React Query: Cargar historial de donaciones con filtros
  // Serializamos los filtros en el queryKey para que React Query los cachee correctamente
  const {
    data: history = [],
    isLoading: historyLoading,
    error: historyError,
  } = useApiQuery<Donation[]>(
    ['donations', 'history', JSON.stringify(historyFilters)],
    (token) => donationApi.getHistory(token, historyFilters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
    }
  );

  // React Query: Cargar datos estáticos
  const { data: donors = [], isLoading: donorsLoading } = useApiQuery<Donor[]>(
    ['donors'],
    (token) => donorApi.getAll(token),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const { data: products = [], isLoading: productsLoading } = useApiQuery<Product[]>(
    ['products', 'all'],
    (token) => productApi.getAll(token),
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

  const { data: donorTypes = [], isLoading: donorTypesLoading } = useApiQuery<DonorType[]>(
    ['donorTypes'],
    (token) => getDonorTypes(token),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const loading = historyLoading || donorsLoading || productsLoading || warehousesLoading || donorTypesLoading;

  // Calcular totalHistory para paginación
  const totalHistory = useMemo(() => {
    if (history.length < ITEMS_PER_PAGE_HISTORY) {
      return (currentPage - 1) * ITEMS_PER_PAGE_HISTORY + history.length;
    } else {
      return currentPage * ITEMS_PER_PAGE_HISTORY;
    }
  }, [history.length, currentPage]);

  // Manejar errores de carga
  useEffect(() => {
    if (historyError) {
      addAlert('Error al cargar el historial de donaciones.', 'error');
    }
  }, [historyError, addAlert]);

  useEffect(() => {
    setCurrentPage(1);
  }, [historySearchTerm]);

  // Los datos ya vienen filtrados y paginados del backend
  const paginatedHistory = history;

  // React Query Mutation: Crear donación
  const createDonationMutation = useApiMutation<
    { success: boolean; donation: Donation },
    NewDonation
  >(
    async (donationData, token) => {
      return await donationApi.createDonation(token, donationData);
    },
    {
      onSuccess: () => {
        addAlert('¡Donación registrada con éxito!', 'success');
      },
      onError: (error) => {
        addAlert(`Error al registrar la donación: ${error.message}`, 'error');
      },
      invalidateQueries: [
        ['donations'], // Invalidar todas las queries de donaciones
      ],
    }
  );

  const handleSaveDonation = useCallback(
    async (donationData: NewDonation) => {
      try {
        await createDonationMutation.mutateAsync(donationData);
        setIsDonationModalOpen(false);
      } catch (error) {
        // Error ya manejado en onError del mutation
        throw error;
      }
    },
    [createDonationMutation]
  );

  const handleCreateDonor = useCallback((name: string) => {
    setNewDonorName(name);
    setIsDonorModalOpen(true);
  }, []);

  // React Query Mutation: Crear donante
  const createDonorMutation = useApiMutation<Donor, NewDonor>(
    async (donorData, token) => {
      return await donorApi.create(token, donorData);
    },
    {
      onSuccess: (newDonor) => {
        addAlert('¡Donante creado con éxito!', 'success');
        setSelectedDonor(newDonor.donor_id);
        setIsDonorModalOpen(false);
        setNewDonorName('');
      },
      onError: (error) => {
        addAlert(`Error al crear nuevo donante: ${error.message}`, 'error');
      },
      invalidateQueries: [
        ['donors'], // Invalidar queries de donantes
      ],
    }
  );

  const handleSaveNewDonor = async (donorData: NewDonor) => {
    try {
      await createDonorMutation.mutateAsync(donorData);
    } catch (error) {
      // Error ya manejado en onError del mutation
      throw error;
    }
  };

  // React Query Mutation: Eliminar donación
  const deleteDonationMutation = useApiMutation<boolean, number>(
    async (donationId, token) => {
      return await donationApi.deleteDonation(token, donationId);
    },
    {
      onSuccess: () => {
        addAlert('Donación eliminada con éxito.', 'success');
        setDonationToDelete(null);
        // Cerrar el modal de items si estaba abierto para la donación eliminada
        if (viewingDonation && donationToDelete && viewingDonation.donation_id === donationToDelete.donation_id) {
          setViewingDonation(null);
        }
      },
      onError: (error) => {
        addAlert(`Error al eliminar la donación: ${error.message}`, 'error');
      },
      invalidateQueries: [
        ['donations'], // Invalidar todas las queries de donaciones para refrescar los datos
      ],
    }
  );

  const handleConfirmDeleteDonation = async () => {
    if (donationToDelete) {
      try {
        await deleteDonationMutation.mutateAsync(donationToDelete.donation_id);
      } catch (error) {
        // Error ya manejado en onError del mutation
      }
    }
  };


  if (loading) return <LoadingSpinner size="lg" message="Cargando donaciones..." fullScreen />;

  return (
    <AnimatedWrapper>
      <Header
        title="Gestión de Donaciones"
        description="Registra nuevas donaciones y consulta el historial."
        buttonText="Registrar Donación"
        onButtonClick={() => setIsDonationModalOpen(true)}
      />
      <div className="grid grid-cols-1 gap-6 items-start">
        {/* Donation History Column */}
        <div>
          <Card>
            <CardHeader
              renderHeaderActions={() => (
                <Input
                  placeholder="Buscar por donante o almacén..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
              )}
            >
              <CardTitle>Historial de Donaciones</CardTitle>
              <CardDescription>
                {totalHistory > 0
                  ? `Mostrando ${paginatedHistory.length} registros${currentPage > 1 || paginatedHistory.length === ITEMS_PER_PAGE_HISTORY ? ` (página ${currentPage})` : ''}.`
                  : 'No se encontraron registros.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center p-4">Cargando historial...</p>
              ) : paginatedHistory.length > 0 ? (
                <div className="space-y-4">
                  {paginatedHistory.map((donation, index) => (
                    <AnimatedWrapper key={donation.donation_id} delay={index * 0.05}>
                      <DonationHistoryCard
                        donation={donation}
                        onViewClick={() => setViewingDonation(donation)}
                        onDeleteClick={() => setDonationToDelete(donation)}
                        isDeleting={deleteDonationMutation.isPending}
                      />
                    </AnimatedWrapper>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <CubeIcon className="mx-auto h-12 w-12" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">
                    No se encontraron donaciones
                  </h3>
                  <p className="mt-1 text-sm">
                    Prueba a ajustar la búsqueda o agrega una nueva donación.
                  </p>
                </div>
              )}
              {totalHistory > ITEMS_PER_PAGE_HISTORY && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalHistory}
                    itemsPerPage={ITEMS_PER_PAGE_HISTORY}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Donación</DialogTitle>
            <DialogDescription>
              Completa los detalles de la donación y agrega los artículos incluidos.
            </DialogDescription>
          </DialogHeader>
          <DonationForm
            donors={donors}
            products={products}
            warehouses={warehouses}
            onSave={handleSaveDonation}
            onCancel={() => setIsDonationModalOpen(false)}
            onCreateDonor={handleCreateDonor}
            isLoading={createDonationMutation.isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog isOpen={isDonorModalOpen} onClose={() => setIsDonorModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Donante</DialogTitle>
          </DialogHeader>
          <DonorForm
            donor={{ donor_name: newDonorName }}
            onSave={handleSaveNewDonor}
            onCancel={() => setIsDonorModalOpen(false)}
            donorTypes={donorTypes}
          />
        </DialogContent>
      </Dialog>

      {viewingDonation && (
        <DonationItemsModal donation={viewingDonation} onClose={() => setViewingDonation(null)} />
      )}

      {/* Dialog de confirmación para eliminar donación */}
      <AlertDialog isOpen={donationToDelete !== null} onClose={() => setDonationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta donación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la donación #{donationToDelete?.donation_id} de{' '}
              {donationToDelete?.donor_name} para {donationToDelete?.warehouse_name} del{' '}
              {donationToDelete?.donation_date
                ? new Date(donationToDelete.donation_date).toLocaleDateString()
                : ''}
              . También se eliminarán todos los items de donación asociados. Los lotes de stock asociados no se eliminarán,
              pero perderán su relación con esta donación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDonationToDelete(null)} disabled={deleteDonationMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteDonation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDonationMutation.isPending}
            >
              {deleteDonationMutation.isPending ? 'Eliminando...' : 'Eliminar Donación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default Donations;
