import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { kitchenApi, getFullProductDetails, categoryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import Header from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import { AnimatedWrapper, AnimatedCounter } from '../../components/Animated';
import {
  ChefHatIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignatureIcon,
  CheckIcon,
  XIcon,
  CubeIcon,
} from '../../components/icons/Icons';
import Table, { Column } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/Dialog';
import { Input, Select } from '../../components/forms';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/AlertDialog';
import StockLotsModal from '../../components/StockLotsModal';
import { useAlerts } from '../../contexts/AlertContext';
import { Category } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import useTableState from '../../hooks/useTableState';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];
type TransactionDetail = Awaited<ReturnType<typeof kitchenApi.getTransactions>>[0];

const getStatusBadge = (status: TransactionDetail['status']) => {
  switch (status) {
    case 'Pending':
      return <Badge variant="warning">Pendiente</Badge>;
    case 'Approved':
      return <Badge variant="primary">Aprobado</Badge>;
    case 'Completed':
      return <Badge variant="success">Completado</Badge>;
    case 'Rejected':
      return <Badge variant="destructive">Rechazado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const TransactionItemsModal: React.FC<{ transaction: TransactionDetail; onClose: () => void }> = ({
  transaction,
  onClose,
}) => {
  return (
    <Dialog isOpen={true} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artículos para la Solicitud #{transaction.transaction_id}</DialogTitle>
          <DialogDescription>
            Solicitado por {transaction.requester_name} el{' '}
            {new Date(transaction.transaction_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0">
          <ul className="divide-y divide-border dark:divide-dark-border">
            {transaction.details.map((item) => (
              <li key={item.product_id} className="py-2 flex justify-between items-center">
                <span>{item.product_name}</span>
                <span className="font-semibold">{item.quantity} unidades</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  delay: number;
}
const StatCard: React.FC<StatCardProps> = React.memo(({ title, value, icon: Icon, delay }) => (
  <AnimatedWrapper delay={delay} direction="up">
    <Card className="shadow-soft hover:shadow-medium transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <AnimatedCounter value={value} />
        </div>
      </CardContent>
    </Card>
  </AnimatedWrapper>
));

const ManagerView: React.FC = () => {
  const { data: userProfile } = useUserProfile();
  const { addAlert } = useAlerts();
  const { refreshNotifications } = useNotifications();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<{
    type: 'approve' | 'reject' | 'complete';
    transaction: TransactionDetail | null;
  }>({ type: 'approve', transaction: null });
  const [viewingLots, setViewingLots] = useState<ProductDetail | null>(null);
  const [viewingSignature, setViewingSignature] = useState<string | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<TransactionDetail | null>(null);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, trans, cats] = await Promise.all([
        getFullProductDetails(''),
        kitchenApi.getTransactions(''),
        categoryApi.getAll(''),
      ]);
      setProducts(prods);
      setTransactions(trans);
      setCategories(cats);
    } catch (error) {
      // Error al cargar datos de gestión de cocina - manejado por el sistema de alertas
      addAlert('Error al cargar los datos de la cocina.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { pendingTransactions, historicalTransactions } = useMemo(() => {
    const pending = transactions.filter((t) => t.status === 'Pending');
    const historical = transactions.filter(
      (t) =>
        t.status !== 'Pending' &&
        (t.requester_name.toLowerCase().includes(transactionSearch.toLowerCase()) ||
          (t.notes || '').toLowerCase().includes(transactionSearch.toLowerCase())) &&
        (transactionStatus === 'all' || t.status.toLowerCase() === transactionStatus)
    );
    return { pendingTransactions: pending, historicalTransactions: historical };
  }, [transactions, transactionSearch, transactionStatus]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(productSearch.toLowerCase()) &&
          (productCategory ? p.category_id === parseInt(productCategory) : true)
      ),
    [products, productSearch, productCategory]
  );

  const stats = useMemo(
    () => ({
      pending: transactions.filter((t) => t.status === 'Pending').length,
      expiring: products.filter(
        (p) => p.days_to_expiry !== null && p.days_to_expiry >= 0 && p.days_to_expiry <= 30
      ).length,
      completedToday: transactions.filter(
        (t) =>
          t.status === 'Completed' &&
          new Date(t.transaction_date).toDateString() === new Date().toDateString()
      ).length,
    }),
    [products, transactions]
  );

  const handleAction = async () => {
    if (!action.transaction || !userProfile) return;
    try {
      let newStatus: TransactionDetail['status'] = 'Pending';
      if (action.type === 'approve') newStatus = 'Approved';
      if (action.type === 'reject') newStatus = 'Rejected';
      if (action.type === 'complete') newStatus = 'Completed';

      await kitchenApi.updateRequestStatus(
        '',
        action.transaction!.transaction_id,
        newStatus,
        userProfile.user_id
      );

      let successMessage = '';
      if (action.type === 'complete') successMessage = 'La solicitud ha sido completada';
      if (action.type === 'approve') successMessage = 'La solicitud ha sido aprobada';
      if (action.type === 'reject') successMessage = 'La solicitud ha sido rechazada';

      addAlert(`${successMessage}!`, 'success');
      await refreshNotifications();
    } catch (error) {
      addAlert('Error al actualizar el estado de la solicitud.', 'error');
    } finally {
      setAction({ type: 'approve', transaction: null });
      fetchData();
    }
  };

  const productColumns: Column<ProductDetail>[] = useMemo(
    () => [
      { header: 'Producto', accessor: 'product_name' },
      { header: 'Categoría', accessor: 'category_name' },
      {
        header: 'Stock Total',
        accessor: (item) => (
          <Button
            variant="ghost"
            className="h-auto p-0 font-normal text-left"
            onClick={() => setViewingLots(item)}
          >
            <Badge
              variant={
                item.total_stock < item.low_stock_threshold ? 'inventory-low' : 'inventory-high'
              }
            >
              {`${item.total_stock} ${item.unit_abbreviation}`}
            </Badge>
          </Button>
        ),
      },
      {
        header: 'Próxima Caducidad',
        accessor: (item) => {
          if (!item.soonest_expiry_date) return <Badge variant="secondary">N/A</Badge>;
          if (item.days_to_expiry! < 0) return <Badge variant="destructive">Caducado</Badge>;
          if (item.days_to_expiry! <= 30)
            return (
              <Badge variant="warning">
                {new Date(item.soonest_expiry_date).toLocaleDateString()}
              </Badge>
            );
          return (
            <Badge variant="success">
              {new Date(item.soonest_expiry_date).toLocaleDateString()}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const baseTransactionColumns: Omit<Column<TransactionDetail>, 'header'>[] = [
    { accessor: 'transaction_id' },
    { accessor: 'requester_name' },
    {
      accessor: (item) => (
        <Button variant="link" size="sm" onClick={() => setViewingTransaction(item)}>
          {item.details.length} artículos
        </Button>
      ),
    },
    { accessor: (item) => getStatusBadge(item.status) },
    { accessor: (item) => new Date(item.transaction_date).toLocaleString() },
  ];

  const pendingTransactionColumns: Column<TransactionDetail>[] = [
    { header: 'ID', ...baseTransactionColumns[0] },
    { header: 'Solicitado Por', ...baseTransactionColumns[1] },
    { header: 'Artículos', ...baseTransactionColumns[2] },
    { header: 'Fecha', ...baseTransactionColumns[4] },
    {
      header: 'Acciones',
      accessor: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            title="Aprobar"
            onClick={() => setAction({ type: 'approve', transaction: item })}
          >
            <CheckIcon className="h-5 w-5 text-success" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Rechazar"
            onClick={() => setAction({ type: 'reject', transaction: item })}
          >
            <XIcon className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const historicalTransactionColumns: Column<TransactionDetail>[] = [
    { header: 'ID', ...baseTransactionColumns[0] },
    { header: 'Solicitado Por', ...baseTransactionColumns[1] },
    { header: 'Artículos', ...baseTransactionColumns[2] },
    { header: 'Estado', ...baseTransactionColumns[3] },
    { header: 'Fecha', ...baseTransactionColumns[4] },
    {
      header: 'Acciones',
      accessor: (item) => {
        if (item.status === 'Approved') {
          return (
            <Button size="sm" onClick={() => setAction({ type: 'complete', transaction: item })}>
              Marcar como Completado
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const { orderedColumns: orderedProductColumns, ...productTableState } =
    useTableState<ProductDetail>(productColumns, 'kitchen-manager-products');
  const { orderedColumns: orderedPendingColumns, ...pendingTableState } =
    useTableState<TransactionDetail>(pendingTransactionColumns, 'kitchen-manager-pending');
  const { orderedColumns: orderedHistoryColumns, ...historyTableState } =
    useTableState<TransactionDetail>(historicalTransactionColumns, 'kitchen-manager-history');

  const getAlertDialogInfo = () => {
    if (!action.transaction) return { title: '', description: '', buttonText: '' };
    switch (action.type) {
      case 'complete':
        return {
          title: '¿Marcar como Completado?',
          description:
            'Esto marcará la solicitud como completada y deducirá los artículos del stock. Esta acción no se puede deshacer.',
          buttonText: 'Completar',
        };
      case 'approve':
        return {
          title: '¿Aprobar Solicitud?',
          description:
            '¿Estás seguro de que quieres aprobar esta solicitud? Se notificará al personal de cocina.',
          buttonText: 'Aprobar',
        };
      case 'reject':
        return {
          title: '¿Rechazar Solicitud?',
          description: '¿Estás seguro de que quieres rechazar esta solicitud?',
          buttonText: 'Rechazar',
        };
      default:
        return { title: '', description: '', buttonText: '' };
    }
  };

  if (loading) return <div>Cargando Vista de Administrador...</div>;

  return (
    <AnimatedWrapper>
      <Header
        title="Gestión de Cocina"
        description="Supervisa las solicitudes de cocina y el inventario disponible."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Solicitudes Pendientes"
          value={stats.pending}
          icon={ClockIcon}
          delay={0.1}
        />
        <StatCard
          title="Artículos por Vencer"
          value={stats.expiring}
          icon={ExclamationTriangleIcon}
          delay={0.2}
        />
        <StatCard
          title="Completado Hoy"
          value={stats.completedToday}
          icon={ChefHatIcon}
          delay={0.3}
        />
      </div>
      <Card className="mb-8 border-primary/50 border-2">
        <CardHeader>
          <CardTitle>Solicitudes Pendientes</CardTitle>
          <CardDescription>Estas solicitudes requieren tu atención inmediata.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={orderedPendingColumns}
            data={pendingTransactions}
            getKey={(t) => t.transaction_id}
            {...pendingTableState}
          />
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar solicitudes..."
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={transactionStatus}
                onChange={(e) => setTransactionStatus(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="all">Todos los Estados</option>
                <option value="approved">Aprobado</option>
                <option value="completed">Completado</option>
                <option value="rejected">Rechazado</option>
              </Select>
            </div>
          )}
        >
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Revisa todas las solicitudes de cocina no pendientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={orderedHistoryColumns}
            data={historicalTransactions}
            getKey={(t) => t.transaction_id}
            {...historyTableState}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar productos..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        >
          <CardTitle>Inventario Disponible</CardTitle>
          <CardDescription>Resumen de todos los productos en todos los almacenes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={orderedProductColumns}
            data={filteredProducts}
            getKey={(p) => p.product_id}
            {...productTableState}
          />
        </CardContent>
      </Card>

      {viewingLots && <StockLotsModal product={viewingLots} onClose={() => setViewingLots(null)} />}
      {viewingSignature && (
        <Dialog isOpen={true} onClose={() => setViewingSignature(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Firma del Solicitante</DialogTitle>
            </DialogHeader>
            <div className="p-6 flex justify-center">
              <img
                src={viewingSignature}
                alt="Signature"
                className="bg-white border border-border"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {viewingTransaction && (
        <TransactionItemsModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
        />
      )}

      <AlertDialog
        isOpen={!!action.transaction}
        onClose={() => setAction({ type: 'approve', transaction: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getAlertDialogInfo().title}</AlertDialogTitle>
            <AlertDialogDescription>{getAlertDialogInfo().description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAction({ type: 'approve', transaction: null })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                action.type === 'reject'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : action.type === 'approve'
                    ? 'bg-success text-success-foreground hover:bg-success/90'
                    : ''
              }
            >
              {getAlertDialogInfo().buttonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default ManagerView;
