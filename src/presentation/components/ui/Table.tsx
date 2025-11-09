import React, { useRef, useState } from 'react';
import {
  EditIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusCircleIcon,
  GripVerticalIcon,
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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedHeader, setDraggedHeader] = useState<string | null>(null);
  const [dragOverHeader, setDragOverHeader] = useState<string | null>(null);
  const draggedColumn = useRef<string | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleDragStart = (header: string) => {
    draggedColumn.current = header;
    setDraggedHeader(header);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    draggedColumn.current = null;
    setDraggedHeader(null);
    setDragOverHeader(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>, header: string) => {
    e.preventDefault();
    if (draggedColumn.current && draggedColumn.current !== header) {
      setDragOverHeader(header);
    }
  };

  const handleDragLeave = () => {
    setDragOverHeader(null);
  };

  const handleDrop = (targetHeader: string, e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    if (!draggedColumn.current || draggedColumn.current === targetHeader) {
      handleDragEnd();
      return;
    }
    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn.current);
    const targetIndex = newOrder.indexOf(targetHeader);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn.current);

    setColumnOrder(newOrder);
    handleDragEnd();
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

  const handleSort = (header: string, isSortable?: boolean, e?: React.MouseEvent) => {
    // Prevenir ordenar si se está arrastrando
    if (isDragging) {
      e?.preventDefault();
      return;
    }
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
                const isBeingDragged = draggedHeader === col.header;
                const isDragOver = dragOverHeader === col.header;
                
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
                    className={`group relative px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-dark-muted-foreground uppercase tracking-wider select-none transition-all duration-200 ${
                      isBeingDragged ? 'opacity-50 border-2 border-dashed border-primary bg-primary/10' : ''
                    } ${
                      isDragOver && !isBeingDragged ? 'border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(col.header)}
                    onDragOver={(e) => handleDragOver(e, col.header)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(col.header, e)}
                    onClick={(e) => handleSort(col.header, isSortable, e)}
                    style={{ 
                      cursor: isDragging 
                        ? 'grabbing' 
                        : isSortable
                          ? 'pointer'
                          : 'grab'
                    }}
                    title={isSortable ? 'Click para ordenar, arrastra para reordenar' : 'Arrastra para reordenar'}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`flex items-center transition-opacity duration-200 shrink-0 ${
                          isDragging || isBeingDragged
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onMouseDown={(e) => e.stopPropagation()}
                        draggable={false}
                      >
                        <GripVerticalIcon 
                          className={`w-3.5 h-3.5 transition-colors duration-200 ${
                            isDragging || isBeingDragged
                              ? 'text-primary'
                              : 'text-muted-foreground/60 group-hover:text-muted-foreground'
                          }`}
                          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                          title="Arrastra para reordenar"
                        />
                      </div>
                      <span className="flex-1">{col.header}</span>
                      {sortIcon}
                    </div>
                    <div
                      className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-primary/50 transition-opacity duration-200 z-10"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, col.header);
                      }}
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
