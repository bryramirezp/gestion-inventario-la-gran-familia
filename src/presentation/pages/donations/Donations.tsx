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
import { Donor, Product, Warehouse, Donation, DonorType, NewDonor, NewDonation } from '@/domain/types';
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
import DonorForm from '@/presentation/features/donations/DonorForm';
import DonationForm from '@/presentation/features/donations/DonationForm';
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

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
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
    </AnimatedWrapper>
  );
};

export default Donations;
