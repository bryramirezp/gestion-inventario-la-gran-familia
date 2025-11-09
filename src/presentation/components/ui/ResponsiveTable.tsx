import React from 'react';
import { useIsMobile } from '@/infrastructure/hooks/useBreakpoint';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import {
  EditIcon,
  TrashIcon,
  PlusCircleIcon,
} from '@/presentation/components/icons/Icons';
import Table, { Column } from './Table';

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getKey: (item: T) => string | number;
  renderMobileCard?: (item: T) => React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRestock?: (item: T) => void;
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
  columnWidths: Record<string, number>;
  handleResize: (header: string, newWidth: number) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig?: (config: { key: string; direction: 'asc' | 'desc' }) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
}

export const ResponsiveTable = <T extends Record<string, any>>({
  columns,
  data,
  getKey,
  renderMobileCard,
  onEdit,
  onDelete,
  onRestock,
  columnOrder,
  setColumnOrder,
  columnWidths,
  handleResize,
  sortConfig,
  setSortConfig,
  renderExpandedRow,
}: ResponsiveTableProps<T>) => {
  const isMobile = useIsMobile();

  const renderCell = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor] as React.ReactNode;
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.length > 0 ? (
          data.map((item) => (
            <Card key={getKey(item)} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  {renderMobileCard ? (
                    renderMobileCard(item)
                  ) : (
                    <div className="space-y-3">
                      {columns.map((col) => {
                        const value = renderCell(item, col);
                        return (
                          <div
                            key={col.header as string}
                            className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2"
                          >
                            <span className="font-medium text-muted-foreground text-sm">
                              {col.header}:
                            </span>
                            <span className="text-foreground text-sm break-words">
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              {(onEdit || onDelete || onRestock) && (
                <CardContent className="pt-0">
                  <div className="flex items-center justify-end gap-2 border-t border-border dark:border-dark-border pt-4">
                    {onRestock && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestock(item)}
                        title="Agregar Stock"
                      >
                        <PlusCircleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Stock</span>
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        title="Editar"
                      >
                        <EditIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Editar</span>
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Eliminar</span>
                      </Button>
                    )}
                  </div>
                  {renderExpandedRow && (
                    <div className="mt-4 pt-4 border-t border-border dark:border-dark-border">
                      {renderExpandedRow(item)}
                    </div>
                  )}
                </CardContent>
              )}
              {renderExpandedRow && !onEdit && !onDelete && !onRestock && (
                <CardContent className="pt-0">
                  {renderExpandedRow(item)}
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No hay datos disponibles.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={data}
      getKey={getKey}
      onEdit={onEdit}
      onDelete={onDelete}
      onRestock={onRestock}
      columnOrder={columnOrder}
      setColumnOrder={setColumnOrder}
      columnWidths={columnWidths}
      handleResize={handleResize}
      sortConfig={sortConfig}
      setSortConfig={setSortConfig}
      renderExpandedRow={renderExpandedRow}
    />
  );
};

