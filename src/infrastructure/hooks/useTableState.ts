import { useState, useMemo, useCallback, useEffect } from 'react';
import { Column } from '../components/Table';

const useTableState = <T extends object>(initialColumns: Column<T>[], storageKey: string, enableReordering: boolean = true) => {
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (!enableReordering) {
      return initialColumns.map((c) => c.header);
    }
    try {
      const savedOrder = localStorage.getItem(`${storageKey}-order`);
      return savedOrder ? JSON.parse(savedOrder) : initialColumns.map((c) => c.header);
    } catch (error) {
      console.error('Failed to parse column order from localStorage', error);
      return initialColumns.map((c) => c.header);
    }
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const savedWidths = localStorage.getItem(`${storageKey}-widths`);
      return savedWidths ? JSON.parse(savedWidths) : {};
    } catch (error) {
      console.error('Failed to parse column widths from localStorage', error);
      return {};
    }
  });

  useEffect(() => {
    if (!enableReordering) return;
    try {
      localStorage.setItem(`${storageKey}-order`, JSON.stringify(columnOrder));
    } catch (error) {
      console.error('Failed to save column order to localStorage', error);
    }
  }, [columnOrder, storageKey, enableReordering]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}-widths`, JSON.stringify(columnWidths));
    } catch (error) {
      console.error('Failed to save column widths to localStorage', error);
    }
  }, [columnWidths, storageKey]);

  const orderedColumns = useMemo(() => {
    if (!enableReordering) {
      return initialColumns;
    }

    // Filter out any columns that may have been removed from initialColumns since last save
    const activeColumns = initialColumns.filter((c) => columnOrder.includes(c.header));
    const newColumns = initialColumns.filter((c) => !columnOrder.includes(c.header));

    // Sort active columns based on saved order, and append any new columns
    return [
      ...activeColumns.sort(
        (a, b) => columnOrder.indexOf(a.header) - columnOrder.indexOf(b.header)
      ),
      ...newColumns,
    ];
  }, [columnOrder, initialColumns, enableReordering]);

  const handleResize = useCallback((header: string, newWidth: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [header]: Math.max(newWidth, 60), // Set a minimum width
    }));
  }, []);

  return {
    orderedColumns,
    columnOrder,
    setColumnOrder,
    columnWidths,
    handleResize,
  };
};

export default useTableState;
