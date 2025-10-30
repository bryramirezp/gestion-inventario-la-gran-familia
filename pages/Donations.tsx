import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/Card';
import { Button } from '../components/Button';
import { Label, Input, FormError } from '../components/forms';
import { AnimatedWrapper } from '../components/Animated';
import { donationApi, donorApi, productApi, warehouseApi, getDonorTypes } from '../services/api';
import { Donor, Product, Warehouse, Donation, DonorType, NewDonor } from '../types';
import { Combobox } from '../components/Combobox';
import {
  TrashIcon,
  CalendarIcon,
  CubeIcon,
  BuildingStorefrontIcon,
} from '../components/icons/Icons';
import Table, { Column } from '../components/Table';
import { useAlerts } from '../contexts/AlertContext';
import CreatableCombobox from '../components/CreatableCombobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/Dialog';
import DonorForm from '../components/DonorForm';
import { DatePicker } from '../components/DatePicker';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

type DonationItem = Donation['items'][0];

const DonationItemsModal: React.FC<{ donation: Donation; onClose: () => void }> = ({
  donation,
  onClose,
}) => {
  const columns: Column<DonationItem>[] = [
    { header: 'Producto', accessor: (item) => (item as any).product_name || 'Unknown Product' },
    { header: 'Cantidad', accessor: 'current_quantity' },
    { header: 'Precio Unitario', accessor: (item) => `$${item.unit_price.toFixed(2)}` },
    { header: 'Descuento', accessor: (item) => `${item.discount_percentage}%` },
    {
      header: 'Total',
      accessor: (item) => {
        const total =
          Number(item.current_quantity) * item.unit_price * (1 - item.discount_percentage / 100);
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
          <Table
            columns={columns}
            data={donation.items}
            getKey={(item) => item.product_id}
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
    <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 hover:border-primary transition-all duration-200">
      {/* Sección Izquierda: Perfil y Total Donado */}
      <div className="flex-grow space-y-2">
        <div>
          <CardTitle className="text-base">{donation.donor_name}</CardTitle>
          <CardDescription>Donación #{donation.donation_id}</CardDescription>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span>Para: {donation.warehouse_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Fecha: {new Date(donation.donation_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Sección Derecha: Estadísticas en fila */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">
            ${donation.total_value_after_discount?.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">{donation.items.length} artículos</p>
        </div>
        <Button variant="outline" onClick={onViewClick}>
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
  unit_price: number;
  discount_percentage: number;
}

const ITEMS_PER_PAGE_HISTORY = 6;

const Donations: React.FC = () => {
  const { getToken } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donorTypes, setDonorTypes] = useState<DonorType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [history, setHistory] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, p, w, h, dt] = await Promise.all([
        donorApi.getAll(''),
        productApi.getAll(''),
        warehouseApi.getAll(''),
        donationApi.getHistory(''),
        getDonorTypes(''),
      ]);
      setDonors(d);
      setProducts(p);
      setWarehouses(w.filter((wh) => wh.is_active));
      setHistory(h);
      setDonorTypes(dt);
    } catch (e) {
      // Error al cargar datos de donaciones - manejado por el sistema de alertas
      addAlert('Error al cargar los datos de la página.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const searchLower = historySearchTerm.toLowerCase();
      return (
        (h.donor_name && h.donor_name.toLowerCase().includes(searchLower)) ||
        (h.warehouse_name && h.warehouse_name.toLowerCase().includes(searchLower))
      );
    });
  }, [history, historySearchTerm]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_HISTORY;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE_HISTORY);
  }, [filteredHistory, currentPage]);

  const handleAddItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      { product_id: null, quantity: 1, expiry_date: null, unit_price: 0, discount_percentage: 0 },
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
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        errors.items![index] =
          'Se requiere un producto y una cantidad válida (>0) para cada artículo.';
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  }, [selectedDonor, selectedWarehouse, items]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addAlert('Por favor, corrige los errores antes de enviar.', 'warning');
      return;
    }
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    try {
      await donationApi.createDonation(token, {
        donor_id: selectedDonor!,
        warehouse_id: selectedWarehouse!,
        items: items,
      });
      addAlert('¡Donación registrada con éxito!', 'success');
      resetForm();
      fetchData(); // Refetch history
    } catch (error) {
      // Error al registrar donación - manejado por el sistema de alertas
      addAlert('Error al registrar la donación.', 'error');
    }
  }, [validateForm, getToken, selectedDonor, selectedWarehouse, items, addAlert, resetForm, fetchData]);

  const handleCreateDonor = (name: string) => {
    setNewDonorName(name);
    setIsDonorModalOpen(true);
  };

  const handleSaveNewDonor = async (donorData: NewDonor) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    try {
      const newDonor = await donorApi.create(token, donorData);
      addAlert('¡Donante creado con éxito!', 'success');
      // Optimistically update donors list to avoid full refetch
      setDonors((prev) => [...prev, newDonor]);
      setSelectedDonor(newDonor.donor_id);
      setIsDonorModalOpen(false);
      setNewDonorName('');
    } catch (error: unknown) {
      // Error al crear donante - manejado por el sistema de alertas
      addAlert(`Error al crear nuevo donante: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  };

  const donorOptions = donors.map((d) => ({ value: d.donor_id, label: d.donor_name }));
  const warehouseOptions = warehouses.map((w) => ({
    value: w.warehouse_id,
    label: w.warehouse_name,
  }));
  const productOptions = products.map((p) => ({ value: p.product_id, label: p.product_name }));

  if (loading) return <LoadingSpinner size="lg" message="Cargando donaciones..." fullScreen />;

  return (
    <AnimatedWrapper>
      <Header
        title="Gestión de Donaciones"
        description="Registra nuevas donaciones y consulta el historial."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Donation Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Detalles de la Donación</CardTitle>
                <CardDescription>Selecciona el donante y el almacén de destino.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Donante *</Label>
                  <CreatableCombobox
                    options={donorOptions}
                    value={selectedDonor}
                    onChange={(val) => setSelectedDonor(val as number)}
                    onCreate={handleCreateDonor}
                    placeholder="Selecciona o crea un donante..."
                  />
                </div>
                <div>
                  <Label>Almacén de Destino *</Label>
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
              <CardHeader>
                <CardTitle>2. Artículos Donados</CardTitle>
                <CardDescription>Agrega cada producto incluido en la donación.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2"> {/* Added max-height and overflow-y-auto */}
                  {items.map((item, index) => (
                    <AnimatedWrapper
                      key={index}
                      delay={index * 0.05}
                      className="rounded-lg border p-4 relative group hover:border-primary/50 transition-all duration-300 bg-muted/30 hover:bg-muted/50"
                      data-item-index={index}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 z-10"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                      <div className="space-y-4">
                        <div>
                          <Label>Producto *</Label>
                          <Combobox
                            options={productOptions}
                            value={item.product_id || null}
                            onChange={(val) => handleItemChange(index, 'product_id', val)}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                              }
                              min="1"
                              placeholder="ej. 10"
                            />
                          </div>
                          <div>
                            <Label>Precio Unitario</Label>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'unit_price',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min="0"
                              step="0.01"
                              placeholder="ej. 15.50"
                            />
                          </div>
                          <div>
                            <Label>Descuento %</Label>
                            <Input
                              type="number"
                              value={item.discount_percentage}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'discount_percentage',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min="0"
                              max="100"
                              placeholder="ej. 10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Fecha de Caducidad</Label>
                          <DatePicker
                            selectedDate={item.expiry_date || null}
                            onSelectDate={(date) => handleItemChange(index, 'expiry_date', date)}
                          />
                        </div>
                      </div>
                      {formErrors.items?.[index] && (
                        <FormError message={formErrors.items?.[index]} className="mt-2" />
                      )}
                    </AnimatedWrapper>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="w-full mt-4"
                >
                  Agregar Otro Artículo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Finalizar Donación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-right p-4 border-t border-b border-border dark:border-dark-border mb-4">
                  <p className="text-muted-foreground">Valor Total (con descuento)</p>
                  <p className="text-2xl font-bold text-foreground">
                    $
                    {items
                      .reduce((acc, item) => {
                        const itemTotal = (item.unit_price || 0) * (item.quantity || 0);
                        const discount = itemTotal * ((item.discount_percentage || 0) / 100);
                        return acc + (itemTotal - discount);
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Donación</Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Donation History Column */}
        <div className="lg:col-span-1">
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
                Mostrando {paginatedHistory.length} de {filteredHistory.length} registros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center p-4">Cargando historial...</p>
              ) : paginatedHistory.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
              {filteredHistory.length > ITEMS_PER_PAGE_HISTORY && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredHistory.length}
                  itemsPerPage={ITEMS_PER_PAGE_HISTORY}
                  onPageChange={setCurrentPage}
                />
              )}
            </CardContent>
          </Card>
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
