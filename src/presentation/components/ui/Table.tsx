import React, { useRef, useState } from 'react';
import {
  EditIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusCircleIcon,
} from '@/presentation/components/icons/Icons';
import { Button } from '@/presentation/components/ui/Button';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRestock?: (item: T) => void;
  getKey: (item: T) => string | number;
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
  columnWidths: Record<string, number>;
  handleResize: (header: string, newWidth: number) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig?: (config: { key: string; direction: 'asc' | 'desc' }) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
}

const Table = <T extends { [key: string]: any }>({
  columns,
  data,
  onEdit,
  onDelete,
  onRestock,
  getKey,
  columnOrder,
  setColumnOrder,
  columnWidths,
  handleResize,
  sortConfig,
  setSortConfig,
  renderExpandedRow,
}: TableProps<T>) => {
  const [expandedKey, setExpandedKey] = useState<string | number | null>(null);
  const draggedColumn = useRef<string | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleDragStart = (header: string) => {
    draggedColumn.current = header;
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  };

  const handleDrop = (targetHeader: string) => {
    if (!draggedColumn.current || draggedColumn.current === targetHeader) return;
    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn.current);
    const targetIndex = newOrder.indexOf(targetHeader);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn.current);

    setColumnOrder(newOrder);
    draggedColumn.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, header: string) => {
    resizeHandleRef.current = e.target as HTMLDivElement;
    startX.current = e.clientX;
    const th = (e.target as HTMLDivElement).parentElement;
    startWidth.current = th?.offsetWidth || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth.current + (moveEvent.clientX - startX.current);
      handleResize(header, newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSort = (header: string, isSortable?: boolean) => {
    if (!setSortConfig || !isSortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === header && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: header, direction });
  };

  const renderCell = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor] as React.ReactNode;
  };

  const hasActions = !!(onEdit || onDelete || onRestock);

  const handleRowClick = (item: T) => {
    if (renderExpandedRow) {
      const key = getKey(item);
      setExpandedKey((prevKey) => (prevKey === key ? null : key));
    }
  };

  return (
    <div className="rounded-lg border border-border dark:border-dark-border overflow-hidden">
      <div className="overflow-x-auto max-h-[calc(100vh-250px)]"> {/* Added max-height and overflow-y-auto */}
        <table
          className="min-w-full divide-y divide-border dark:divide-dark-border"
          style={{ tableLayout: 'fixed' }}
        >
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.header}
                style={{
                  width: columnWidths[col.header] ? `${columnWidths[col.header]}px` : 'auto',
                }}
              />
            ))}
            {hasActions && <col style={{ width: '150px' }} />}
          </colgroup>
          <thead className="bg-muted/50 dark:bg-dark-muted/50">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable && !!setSortConfig;
                const sortIcon =
                  sortConfig?.key === col.header ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUpIcon className="w-3 h-3 ml-2" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3 ml-2" />
                    )
                  ) : isSortable ? (
                    <ArrowsUpDownIcon className="w-3 h-3 ml-2 text-muted-foreground" />
                  ) : null;

                return (
                  <th
                    key={col.header}
                    scope="col"
                    className="group relative px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-dark-muted-foreground uppercase tracking-wider select-none"
                    draggable
                    onDragStart={() => handleDragStart(col.header)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(col.header)}
                    onClick={() => handleSort(col.header, isSortable)}
                    style={{ cursor: isSortable ? 'pointer' : 'move' }}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {sortIcon}
                    </div>
                    <div
                      className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-primary/50"
                      onMouseDown={(e) => handleMouseDown(e, col.header)}
                    />
                  </th>
                );
              })}
              {hasActions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-card dark:bg-dark-card divide-y divide-border dark:divide-dark-border">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <React.Fragment key={getKey(item)}>
                  <AnimatedWrapper
                    as="tr"
                    delay={rowIndex * 0.05}
                    className={`transition-colors ${renderExpandedRow ? 'cursor-pointer' : ''} ${expandedKey === getKey(item) ? 'bg-muted/50 dark:bg-dark-muted/50' : 'hover:bg-muted/50 dark:hover:bg-dark-muted/50'}`}
                    onClick={() => handleRowClick(item)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.header}
                        className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-dark-foreground overflow-hidden text-ellipsis"
                      >
                        {renderCell(item, col)}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          {onRestock && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestock(item);
                              }}
                              title="Agregar Stock"
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                              title="Editar"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </AnimatedWrapper>
                  {renderExpandedRow && expandedKey === getKey(item) && (
                    <tr className="bg-muted/30 dark:bg-dark-muted/30">
                      <td colSpan={columns.length + (hasActions ? 1 : 0)}>
                        {renderExpandedRow(item)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="text-center py-10 text-muted-foreground"
                >
                  No hay datos disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
