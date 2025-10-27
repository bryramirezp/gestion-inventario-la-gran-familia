import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donorApi, warehouseApi } from '../services/api';
import { Donor, DonorAnalysisData, Donation, Warehouse } from '../types';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { AnimatedWrapper, AnimatedCounter } from '../components/Animated';
import { ChevronLeftIcon, UserCircleIcon } from '../components/icons/Icons';
import { Button } from '../components/Button';
import Table, { Column } from '../components/Table';
import { Input, Select } from '../components/forms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/Dialog';
import useTableState from '../hooks/useTableState';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

type DonationItem = Donation['items'][0];

const DonationItemsModal: React.FC<{ donation: Donation; onClose: () => void }> = ({
  donation,
  onClose,
}) => {
  const columns: Column<DonationItem>[] = [
    { header: 'Producto', accessor: (item) => (item as any).product_name },
    { header: 'Cantidad', accessor: 'current_quantity' },
    { header: 'Precio Unitario', accessor: (item) => `$${item.unit_price.toFixed(2)}` },
    { header: 'Descuento', accessor: (item) => `${item.discount_percentage}%` },
    {
      header: 'Total',
      accessor: (item) => {
        const total =
          item.current_quantity * item.unit_price * (1 - item.discount_percentage / 100);
        return `$${total.toFixed(2)}`;
      },
    },
  ];

  // Note: This modal table doesn't need persistence, so we don't use the hook here.
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
            getKey={(item: any) => item.product_id}
            {...staticTableState}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DonorDetail: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { id } = useParams<{ id: string }>();
  const donorId = id ? parseInt(id, 10) : undefined;

  const [donor, setDonor] = useState<Donor | null>(null);
  const [analysis, setAnalysis] = useState<DonorAnalysisData | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);

  const fetchData = useCallback(async () => {
    if (!donorId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [details, whs] = await Promise.all([
        donorApi.getByIdWithDetails('', donorId),
        warehouseApi.getAll(''),
      ]);

      if (details) {
        setDonor(details.donor);
        setAnalysis(details.analysis);
        setDonations(details.donations);
      }
      setWarehouses(whs);
    } catch (error) {
      console.error('Failed to fetch donor details', error);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchesWarehouse = selectedWarehouse
        ? d.warehouse_id === parseInt(selectedWarehouse)
        : true;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = d.warehouse_name?.toLowerCase().includes(searchLower);
      return matchesWarehouse && matchesSearch;
    });
  }, [donations, selectedWarehouse, searchTerm]);

  const donationColumns: Column<Donation>[] = useMemo(
    () => [
      { header: 'ID', accessor: 'donation_id' },
      { header: 'Almacén', accessor: 'warehouse_name' },
      { header: 'Fecha', accessor: (item) => new Date(item.donation_date).toLocaleDateString() },
      { header: 'Artículos', accessor: (item) => item.items.length },
      { header: 'Valor', accessor: (item) => `$${item.total_value_after_discount?.toFixed(2)}` },
      {
        header: 'Acciones',
        accessor: (item) => (
          <Button variant="outline" size="sm" onClick={() => setViewingDonation(item)}>
            Ver Artículos
          </Button>
        ),
      },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<Donation>(
    donationColumns,
    `donor-detail-${donorId}-donations`
  );

  if (loading) return <div>Cargando detalles del donante...</div>;
  if (!donor || !analysis)
    return (
      <div>
        Donante no encontrado.{' '}
        <Link to="/donors" className="text-primary hover:underline">
          Volver
        </Link>
      </div>
    );

  return (
    <AnimatedWrapper>
      <div className="mb-6">
        <Button as={Link} to="/donors" variant="ghost" className="mb-2">
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Volver a Donantes
        </Button>
        <Header
          title="Perfil del Donante"
          description="Revisa el historial de contribuciones y la información de contacto de este donante."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-muted dark:bg-dark-muted rounded-full mb-4 flex items-center">
                <UserCircleIcon className="h-16 w-16 text-primary" />
                <div className="ml-3 flex flex-col">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {donor.donor_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {donor.contact_person || 'Sin persona de contacto'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>Correo:</strong> {donor.email || 'N/A'}
              </p>
              <p>
                <strong>Teléfono:</strong> {donor.phone || 'N/A'}
              </p>
              <p>
                <strong>Dirección:</strong> {donor.address || 'N/A'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Contribución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Total Donado</span>
                <div className="text-3xl font-bold text-foreground">
                  $<AnimatedCounter value={analysis.total_value_donated} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Donaciones Totales</p>
                  <p className="font-bold text-lg">{analysis.total_donations_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Donación</p>
                  <p className="font-bold text-lg">
                    {analysis.last_donation_date
                      ? new Date(analysis.last_donation_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              renderHeaderActions={() => (
                <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                  <Input
                    placeholder="Buscar por almacén..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <Select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full sm:w-48"
                  >
                    <option value="">Todos los Almacenes</option>
                    {warehouses.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            >
              <CardTitle>Historial de Donaciones</CardTitle>
              <CardDescription>
                Mostrando {filteredDonations.length} de {donations.length} donaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table
                columns={orderedColumns}
                data={filteredDonations}
                getKey={(d) => d.donation_id}
                {...tableState}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {viewingDonation && (
        <DonationItemsModal donation={viewingDonation} onClose={() => setViewingDonation(null)} />
      )}
    </AnimatedWrapper>
  );
};

export default DonorDetail;
