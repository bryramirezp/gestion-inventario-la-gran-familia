import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Column } from './Table';

export interface VirtualizedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getKey: (item: T) => string | number;
  height?: number;
  itemHeight?: number;
  renderRow?: (item: T, index: number) => React.ReactNode;
  onRowClick?: (item: T) => void;
}

/**
 * Componente de tabla virtualizada para listas grandes
 * Solo renderiza los elementos visibles en el viewport, mejorando el rendimiento
 * para listas con muchos elementos (1000+)
 *
 * @example
 * ```tsx
 * <VirtualizedTable
 *   columns={columns}
 *   data={products}
 *   getKey={(p) => p.product_id}
 *   height={600}
 *   itemHeight={50}
 * />
 * ```
 */
export function VirtualizedTable<T extends Record<string, unknown>>({
  columns,
  data,
  getKey,
  height = 600,
  itemHeight = 50,
  renderRow,
  onRowClick,
}: VirtualizedTableProps<T>) {
  // Memoizar la función de renderizado de filas
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = data[index];
      if (!item) return null;

      if (renderRow) {
        return (
          <div style={style} onClick={() => onRowClick?.(item)}>
            {renderRow(item, index)}
          </div>
        );
      }

      return (
        <div
          style={style}
          className="flex items-center border-b border-border dark:border-dark-border hover:bg-muted/50 dark:hover:bg-dark-muted/50 cursor-pointer"
          onClick={() => onRowClick?.(item)}
        >
          {columns.map((col) => {
            const value =
              typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
            return (
              <div key={col.header as string} className="px-4 py-2 flex-1 text-sm">
                {value}
              </div>
            );
          })}
        </div>
      );
    },
    [data, columns, renderRow, onRowClick]
  );

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No hay datos disponibles.
      </div>
    );
  }

  return (
    <div className="border border-border dark:border-dark-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-muted/50 dark:bg-dark-muted/50 border-b border-border dark:border-dark-border">
        {columns.map((col) => (
          <div key={col.header as string} className="px-4 py-3 flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized list */}
      <List height={height} itemCount={data.length} itemSize={itemHeight} width="100%">
        {Row}
      </List>
    </div>
  );
}

