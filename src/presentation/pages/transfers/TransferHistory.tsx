import React, { useState, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Input, Select } from '@/presentation/components/forms';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { transferApi, warehouseApi } from '@/data/api';
import { StockTransferWithDetails, TransferStatus } from '@/domain/types';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery';
import useTableState from '@/infrastructure/hooks/useTableState';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import Pagination from '@/presentation/components/ui/Pagination';

const ITEMS_PER_PAGE = 20;

const TransferHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');

  const { data: allTransfers = [], isLoading: transfersLoading } = useApiQuery<StockTransferWithDetails[]>(
    ['transfers', 'history', statusFilter],
    async (token) => {
      const filters: any = {};
      if (statusFilter) {
        filters.status = statusFilter as TransferStatus;
      }
      return transferApi.getHistory(token, filters);
    },
    {
      staleTime: 30 * 1000,
    }
  );

  const { data: warehouses = [] } = useApiQuery(
    ['warehouses'],
    (token) => warehouseApi.getAll(token),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const filteredTransfers = useMemo(() => {
    let filtered = allTransfers;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transfer_id.toString().includes(searchLower) ||
          t.lot_id.toString().includes(searchLower) ||
          t.notes?.toLowerCase().includes(searchLower) ||
          t.from_warehouse?.warehouse_name.toLowerCase().includes(searchLower) ||
          t.to_warehouse?.warehouse_name.toLowerCase().includes(searchLower) ||
          t.requested_by_user?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    if (warehouseFilter) {
      const warehouseId = parseInt(warehouseFilter, 10);
      filtered = filtered.filter(
        (t) => t.from_warehouse_id === warehouseId || t.to_warehouse_id === warehouseId
      );
    }

    return filtered;
  }, [allTransfers, searchTerm, warehouseFilter]);

  const paginatedTransfers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredTransfers.slice(start, end);
  }, [filteredTransfers, currentPage]);

  const columns: Column<StockTransferWithDetails>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'transfer_id',
      },
      {
        header: 'Fecha',
        accessor: (item) => new Date(item.created_at).toLocaleString('es-MX'),
      },
      {
        header: 'Lote',
        accessor: (item) => `#${item.lot_id}`,
      },
      {
        header: 'Origen',
        accessor: (item) => item.from_warehouse?.warehouse_name || `#${item.from_warehouse_id}`,
      },
      {
        header: 'Destino',
        accessor: (item) => item.to_warehouse?.warehouse_name || `#${item.to_warehouse_id}`,
      },
      {
        header: 'Cantidad',
        accessor: 'quantity',
      },
      {
        header: 'Estado',
        accessor: (item) => (
          <Badge
            variant={
              item.status === 'COMPLETED'
                ? 'default'
                : item.status === 'APPROVED'
                ? 'default'
                : item.status === 'REJECTED'
                ? 'destructive'
                : 'warning'
            }
          >
            {item.status}
          </Badge>
        ),
      },
      {
        header: 'Solicitado por',
        accessor: (item) => item.requested_by_user?.full_name || 'N/A',
      },
      {
        header: 'Aprobado por',
        accessor: (item) => item.approved_by_user?.full_name || '-',
      },
      {
        header: 'Notas',
        accessor: (item) => item.notes || '-',
      },
      {
        header: 'Motivo Rechazo',
        accessor: (item) => item.rejection_reason || '-',
      },
    ],
    []
  );

  const tableState = useTableState(columns);

  return (
    <AnimatedWrapper>
      <Header
        title="Historial de Traspasos"
        description="Historial completo de traspasos entre almacenes"
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historial de Traspasos</CardTitle>
            <CardDescription>
              Historial completo de traspasos. Total: {filteredTransfers.length} traspasos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por ID, lote, almacén o usuario..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="APPROVED">Aprobados</option>
                <option value="REJECTED">Rechazados</option>
                <option value="COMPLETED">Completados</option>
              </Select>
              <Select
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos los almacenes</option>
                {warehouses
                  .filter((w) => w.is_active)
                  .map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id.toString()}>
                      {w.warehouse_name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {transfersLoading ? (
            <LoadingSpinner size="lg" message="Cargando historial..." />
          ) : (
            <>
              <ResponsiveTable
                columns={columns}
                data={paginatedTransfers}
                getKey={(t) => t.transfer_id.toString()}
                {...tableState}
              />
              {filteredTransfers.length > ITEMS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredTransfers.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
};

export default TransferHistory;

