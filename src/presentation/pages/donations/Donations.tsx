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
import { Label, Input, FormError } from '@/presentation/components/forms';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { donationApi, donorApi, productApi, warehouseApi, getDonorTypes } from '@/data/api';
import { Donor, Product, Warehouse, Donation, DonorType, NewDonor, NewDonation } from '@/domain/types';
import { Combobox } from '@/presentation/features/shared/Combobox';
import {
  TrashIcon,
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
import DonorForm from '@/presentation/features/donations/DonorForm';
import { DatePicker } from '@/presentation/features/shared/DatePicker';
import Pagination from '@/presentation/components/ui/Pagination';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';

type DonationItem = Donation['items'][0];

const DonationItemsModal: React.FC<{ donation: Donation; onClose: () => void }> = ({
  donation,
  onClose,
}) => {
  const columns: Column<DonationItem>[] = [
    { header: 'Producto', accessor: (item) => item.product_name || 'Unknown Product' },
    { header: 'Cantidad', accessor: 'current_quantity' },
    { header: 'Precio Mercado', accessor: (item) => `$${item.market_unit_price.toFixed(2)}` },
    { header: 'Precio Real', accessor: (item) => `$${item.actual_unit_price.toFixed(2)}` },
    {
      header: 'Total',
      accessor: (item) => {
        const total = Number(item.current_quantity) * item.actual_unit_price;
        return `$${total.toFixed(2)}`;
      },
    },
  ];

  const staticTableState = {
    columnOrder: columns.map((c) => c.header),
    setColumnOrder: () => {},
    columnWidths: {},
    handleResize: () => {},
  };

  return (
    <Dialog isOpen={true} onClose={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Artículos en la Donación #{donation.donation_id}</DialogTitle>
          <DialogDescription>
            De {donation.donor_name} para {donation.warehouse_name} el{' '}
            {new Date(donation.donation_date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0">
          <ResponsiveTable
            columns={columns}
            data={donation.items}
            getKey={(item) => item.product_id}
            renderMobileCard={(item) => {
              const total = Number(item.current_quantity) * item.actual_unit_price;
              return (
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{item.product_name || 'Unknown Product'}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Cantidad: {item.current_quantity}</div>
                    <div>Precio de Mercado: ${item.market_unit_price.toFixed(2)}</div>
                    <div>Precio Real: ${item.actual_unit_price.toFixed(2)}</div>
                    <div className="font-semibold text-foreground">Total: ${total.toFixed(2)}</div>
                  </div>
                </div>
              );
            }}
            {...staticTableState}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface DonationHistoryCardProps {
  donation: Donation;
  onViewClick: () => void;
}
const DonationHistoryCard: React.FC<DonationHistoryCardProps> = React.memo(
  ({ donation, onViewClick }) => (
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

      {/* Sección Derecha: Estadísticas y Botón */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
        <div className="text-right flex-grow sm:flex-grow-0">
          <p className="font-bold text-base sm:text-lg text-foreground">
            ${donation.total_actual_value?.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">{donation.items.length} artículos</p>
        </div>
        <Button variant="outline" onClick={onViewClick} className="flex-shrink-0" size="sm">
          Ver Artículos
        </Button>
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

  const [selectedDonor, setSelectedDonor] = useState<number | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [items, setItems] = useState<DonationItemForm[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<{
    general?: string;
    items?: Record<number, string>;
  }>({});
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);

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

  // Filtrar warehouses activos
  const activeWarehouses = useMemo(
    () => warehouses.filter((w) => w.is_active),
    [warehouses]
  );

  // Los datos ya vienen filtrados y paginados del backend
  const paginatedHistory = history;

  const handleAddItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      { product_id: null, quantity: 1, expiry_date: null, market_unit_price: 0, actual_unit_price: 0 },
    ]);
    // Add micro-interaction feedback
    setTimeout(() => {
      const newItemIndex = items.length; // Use current items.length for the new item's index
      const newItemElement = document.querySelector(`[data-item-index="${newItemIndex}"]`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newItemElement.classList.add('animate-pulse');
        setTimeout(() => newItemElement.classList.remove('animate-pulse'), 1000);
      }
    }, 100);
  }, [items.length]); // Dependency on items.length to correctly target the new item

  const handleItemChange = useCallback((index: number, field: keyof DonationItemForm, value: string | number | null) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setSelectedDonor(null);
    setSelectedWarehouse(null);
    setItems([]);
    setFormErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const errors: { general?: string; items?: Record<number, string> } = { items: {} };
    let isValid = true;
    if (!selectedDonor) {
      errors.general = 'Se debe seleccionar un donante.';
      isValid = false;
    }
    if (!selectedWarehouse) {
      errors.general = (errors.general || '') + ' Se debe seleccionar un almacén.';
      isValid = false;
    }
    if (items.length === 0) {
      errors.general = (errors.general || '') + ' Se debe agregar al menos un artículo.';
      isValid = false;
    }
    items.forEach((item, index) => {
      if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.market_unit_price || !item.actual_unit_price) {
        errors.items![index] =
          'Se requiere un producto, cantidad válida (>0), precio de mercado y precio real para cada artículo.';
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  }, [selectedDonor, selectedWarehouse, items]);

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
        resetForm();
      },
      onError: (error) => {
        addAlert(`Error al registrar la donación: ${error.message}`, 'error');
      },
      invalidateQueries: [
        ['donations'], // Invalidar todas las queries de donaciones
      ],
    }
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) {
        addAlert('Por favor, corrige los errores antes de enviar.', 'warning');
        return;
      }
      try {
        await createDonationMutation.mutateAsync({
          donor_id: selectedDonor!,
          warehouse_id: selectedWarehouse!,
          items: items,
        });
      } catch (error) {
        // Error ya manejado en onError del mutation
      }
    },
    [validateForm, selectedDonor, selectedWarehouse, items, addAlert, resetForm, createDonationMutation]
  );

  const handleCreateDonor = (name: string) => {
    setNewDonorName(name);
    setIsDonorModalOpen(true);
  };

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

  const donorOptions = useMemo(
    () => donors.map((d) => ({ value: d.donor_id, label: d.donor_name })),
    [donors]
  );
  const warehouseOptions = useMemo(
    () =>
      activeWarehouses.map((w) => ({
        value: w.warehouse_id,
        label: w.warehouse_name,
      })),
    [activeWarehouses]
  );
  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.product_id, label: p.product_name })),
    [products]
  );

  if (loading) return <LoadingSpinner size="lg" message="Cargando donaciones..." fullScreen />;

  return (
    <AnimatedWrapper>
      <Header
        title="Gestión de Donaciones"
        description="Registra nuevas donaciones y consulta el historial."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Donation History Column - Left Side (Large) */}
        <div className="lg:col-span-2">
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

        {/* Donation Form Column - Right Side (Small) */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Detalles de la Donación</CardTitle>
                <CardDescription className="text-xs">
                  Selecciona el donante y el almacén de destino.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <Label className="text-sm">Donante *</Label>
                  <CreatableCombobox
                    options={donorOptions}
                    value={selectedDonor}
                    onChange={(val) => setSelectedDonor(val as number)}
                    onCreate={handleCreateDonor}
                    placeholder="Selecciona o crea un donante..."
                  />
                </div>
                <div>
                  <Label className="text-sm">Almacén de Destino *</Label>
                  <Combobox
                    options={warehouseOptions}
                    value={selectedWarehouse}
                    onChange={(val) => setSelectedWarehouse(val as number)}
                    placeholder="Selecciona un almacén..."
                  />
                </div>
                {formErrors.general && <FormError message={formErrors.general} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Artículos Donados</CardTitle>
                <CardDescription className="text-xs">
                  Agrega cada producto incluido en la donación.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item, index) => (
                    <AnimatedWrapper
                      key={index}
                      delay={index * 0.05}
                      className="rounded-lg border p-3 relative group hover:border-primary/50 transition-all duration-300 bg-muted/30 hover:bg-muted/50"
                      data-item-index={index}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 z-10 h-6 w-6"
                      >
                        <TrashIcon className="h-3 w-3 text-destructive" />
                      </Button>
                      <div className="space-y-2 pr-6">
                        <div>
                          <Label className="text-xs">Producto *</Label>
                          <Combobox
                            options={productOptions}
                            value={item.product_id || null}
                            onChange={(val) => handleItemChange(index, 'product_id', val)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Cantidad *</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                              }
                              min="1"
                              placeholder="10"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Precio de Mercado *</Label>
                            <Input
                              type="number"
                              value={item.market_unit_price}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'market_unit_price',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min="0"
                              step="0.01"
                              placeholder="15.50"
                              className="h-8 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Precio Real *</Label>
                            <Input
                              type="number"
                              value={item.actual_unit_price}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'actual_unit_price',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min="0"
                              step="0.01"
                              placeholder="12.00"
                              className="h-8 text-sm"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Caducidad</Label>
                          <DatePicker
                            selectedDate={item.expiry_date || null}
                            onSelectDate={(date) => handleItemChange(index, 'expiry_date', date)}
                          />
                        </div>
                      </div>
                      {formErrors.items?.[index] && (
                        <FormError message={formErrors.items?.[index]} className="mt-1 text-xs" />
                      )}
                    </AnimatedWrapper>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="w-full mt-3 text-sm h-8"
                >
                  Agregar Otro Artículo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Finalizar Donación</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-right p-3 border-t border-b border-border dark:border-dark-border mb-3">
                  <p className="text-xs text-muted-foreground">Valor Total (Precio Real)</p>
                  <p className="text-xl font-bold text-foreground">
                    $
                    {items
                      .reduce((acc, item) => {
                        return acc + (item.actual_unit_price || 0) * (item.quantity || 0);
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full text-sm h-9">
                    Registrar Donación
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetForm} className="w-full text-sm h-8">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

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
    </AnimatedWrapper>
  );
};

export default Donations;
