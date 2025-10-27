import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/Dialog';
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
import { donorApi, getDonorTypes } from '../services/api';
import { Donor, NewDonor, DonorType, DonorAnalysisData } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Input, Select } from '../components/forms';
import { AnimatedWrapper } from '../components/Animated';
import { useAlerts } from '../contexts/AlertContext';
import { UserGroupIcon, CubeIcon, CalendarIcon } from '../components/icons/Icons';
import DonorForm from '../components/DonorForm';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 8;

const getInitials = (name: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

interface DonorCardProps {
  donor: DonorAnalysisData;
  donorTypeName: string;
}
const DonorCard: React.FC<DonorCardProps> = React.memo(({ donor, donorTypeName }) => (
  <Link
    to={`/donors/${donor.donor_id}`}
    className="block h-full group focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
  >
    <Card className="h-full flex flex-col border border-border dark:border-dark-border hover:border-primary dark:hover:border-primary hover:shadow-elegant dark:hover:shadow-dark-medium transition-all duration-300 group-hover:-translate-y-1">
      <CardContent className="p-6 flex flex-col flex-grow">
        {/* Header with Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-accent dark:bg-dark-accent flex items-center justify-center border border-border dark:border-dark-border">
            <span className="text-xl font-bold text-accent-foreground dark:text-dark-accent-foreground">
              {getInitials(donor.donor_name)}
            </span>
          </div>
          <div className="min-w-0">
            <p
              className="font-semibold text-foreground dark:text-dark-foreground truncate"
              title={donor.donor_name}
            >
              {donor.donor_name}
            </p>
            <p
              className="text-sm text-muted-foreground dark:text-dark-muted-foreground truncate"
              title={donorTypeName}
            >
              {donorTypeName}
            </p>
          </div>
        </div>

        {/* Main Stats */}
        <div className="flex-grow space-y-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Total Donado</span>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              ${donor.total_value_donated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="border-t border-border dark:border-dark-border pt-4 flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2" title="Donaciones totales">
            <CubeIcon className="w-4 h-4" />
            <span>{donor.total_donations_count}</span>
          </div>
          <div className="flex items-center gap-2" title="Fecha de última donación">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {donor.last_donation_date
                ? new Date(donor.last_donation_date).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
));

const Donors: React.FC = () => {
  const { getToken } = useAuth();
  const [donors, setDonors] = useState<DonorAnalysisData[]>([]);
  const [donorTypes, setDonorTypes] = useState<DonorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null);
  const { addAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      const [donorData, donorTypeData] = await Promise.all([
        donorApi.getAnalysis(''),
        getDonorTypes(''),
      ]);
      setDonors(donorData.sort((a, b) => b.total_value_donated - a.total_value_donated));
      setDonorTypes(donorTypeData);
    } catch (error) {
      console.error('Failed to fetch donors', error);
      addAlert('Error al cargar los donantes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const matchesSearch = d.donor_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType ? d.donor_type_id === parseInt(selectedType) : true;
      return matchesSearch && matchesType;
    });
  }, [donors, searchTerm, selectedType]);

  const paginatedDonors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDonors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDonors, currentPage]);

  const handleOpenModal = (donor: Donor | null = null) => {
    setEditingDonor(donor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingDonor(null);
    setIsModalOpen(false);
  };

  const handleSave = async (donorData: NewDonor) => {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      return;
    }
    if (editingDonor) {
      await donorApi.update(token, editingDonor.donor_id, donorData);
      addAlert('¡Donante actualizado con éxito!', 'success');
    } else {
      await donorApi.create(token, donorData);
      addAlert('¡Donante creado con éxito!', 'success');
    }
    fetchDonors();
    handleCloseModal();
  };

  const handleOpenAlert = (donor: Donor) => {
    setDonorToDelete(donor);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (donorToDelete) {
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        return;
      }
      try {
        await donorApi.delete(token, donorToDelete.donor_id);
        addAlert('Donante eliminado con éxito.', 'success');
        fetchDonors();
      } catch (error) {
        console.error('Failed to delete donor', error);
        addAlert('Error al eliminar el donante.', 'error');
      } finally {
        setIsAlertOpen(false);
        setDonorToDelete(null);
      }
    }
  };

  const donorTypeMap = new Map(donorTypes.map((dt) => [dt.donor_type_id, dt.type_name]));

  return (
    <AnimatedWrapper>
      <Header
        title="Donantes"
        description="Administra tu lista de donantes."
        buttonText="Agregar Donante"
        onButtonClick={() => handleOpenModal()}
      />
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar donantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Todos los Tipos</option>
                {donorTypes.map((dt) => (
                  <option key={dt.donor_type_id} value={dt.donor_type_id}>
                    {dt.type_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        >
          <CardTitle>Todos los Donantes</CardTitle>
          <CardDescription>
            Mostrando {filteredDonors.length} de {donors.length} donantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando donantes...</p>
          ) : paginatedDonors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedDonors.map((donor, index) => (
                <AnimatedWrapper key={donor.donor_id} delay={index * 0.05}>
                  <DonorCard
                    donor={donor}
                    donorTypeName={donorTypeMap.get(donor.donor_type_id) || 'N/A'}
                  />
                </AnimatedWrapper>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <UserGroupIcon className="mx-auto h-12 w-12" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No se encontraron donantes
              </h3>
              <p className="mt-1 text-sm">
                Prueba a ajustar los filtros o agrega un nuevo donante.
              </p>
            </div>
          )}
          {filteredDonors.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredDonors.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDonor ? 'Editar Donante' : 'Agregar Nuevo Donante'}</DialogTitle>
          </DialogHeader>
          <DonorForm
            donor={editingDonor}
            onSave={handleSave}
            onCancel={handleCloseModal}
            donorTypes={donorTypes}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente al donante "{donorToDelete?.donor_name}".
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

export default Donors;
