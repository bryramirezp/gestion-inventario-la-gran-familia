import React, { useState, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Input, Select } from '@/presentation/components/forms';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { adjustmentApi, warehouseApi } from '@/data/api';
import { InventoryAdjustmentWithDetails, AdjustmentStatus } from '@/domain/types';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery';
import useTableState from '@/infrastructure/hooks/useTableState';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import Pagination from '@/presentation/components/ui/Pagination';

const ITEMS_PER_PAGE = 20;

const AdjustmentHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');

  const { data: allAdjustments = [], isLoading: adjustmentsLoading } = useApiQuery<
    InventoryAdjustmentWithDetails[]
  >(
    ['adjustments', 'history', statusFilter],
    async (token) => {
      const filters: any = {};
      if (statusFilter) {
        filters.status = statusFilter as AdjustmentStatus;
      }
      return adjustmentApi.getHistory(token, filters);
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

  const filteredAdjustments = useMemo(() => {
    let filtered = allAdjustments;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.adjustment_id.toString().includes(searchLower) ||
          a.lot_id.toString().includes(searchLower) ||
          a.reason?.toLowerCase().includes(searchLower) ||
          a.created_by_user?.full_name?.toLowerCase().includes(searchLower) ||
          a.approved_by_user?.full_name?.toLowerCase().includes(searchLower) ||
          a.rejected_by_user?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    if (warehouseFilter) {
      const warehouseId = parseInt(warehouseFilter, 10);
      filtered = filtered.filter((a) => {
        // Necesitamos obtener el warehouse_id del lote
        // Por ahora, filtramos por lot_id si tenemos acceso al objeto lot
        return a.lot && (a.lot as any).warehouse_id === warehouseId;
      });
    }

    return filtered;
  }, [allAdjustments, searchTerm, warehouseFilter]);

  const paginatedAdjustments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAdjustments.slice(start, end);
  }, [filteredAdjustments, currentPage]);

  const columns: Column<InventoryAdjustmentWithDetails>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'adjustment_id',
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
        header: 'Cantidad Antes',
        accessor: (item) => item.quantity_before?.toFixed(2) || 'N/A',
      },
      {
        header: 'Cantidad Después',
        accessor: (item) => item.quantity_after.toFixed(2),
      },
      {
        header: 'Diferencia',
        accessor: (item) => {
          const diff = item.quantity_after - (item.quantity_before || 0);
          return (
            <span className={diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {diff >= 0 ? '+' : ''}
              {diff.toFixed(2)}
            </span>
          );
        },
      },
      {
        header: 'Estado',
        accessor: (item) => (
          <Badge
            variant={
              item.status === 'APPROVED'
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
        header: 'Motivo',
        accessor: (item) => (
          <div className="max-w-xs truncate" title={item.reason}>
            {item.reason}
          </div>
        ),
      },
      {
        header: 'Solicitado por',
        accessor: (item) => item.created_by_user?.full_name || 'N/A',
      },
      {
        header: 'Aprobado por',
        accessor: (item) => item.approved_by_user?.full_name || '-',
      },
      {
        header: 'Rechazado por',
        accessor: (item) => item.rejected_by_user?.full_name || '-',
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
        title="Historial de Ajustes"
        description="Historial completo de ajustes de inventario"
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historial de Ajustes</CardTitle>
            <CardDescription>
              Historial completo de ajustes. Total: {filteredAdjustments.length} ajustes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por ID, lote, motivo o usuario..."
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

          {adjustmentsLoading ? (
            <LoadingSpinner size="lg" message="Cargando historial..." />
          ) : (
            <>
              <ResponsiveTable
                columns={columns}
                data={paginatedAdjustments}
                getKey={(a) => a.adjustment_id.toString()}
                {...tableState}
              />
              {filteredAdjustments.length > ITEMS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredAdjustments.length}
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

export default AdjustmentHistory;

