import { useState, useEffect } from 'react';

let exceljsModule: unknown = null;
let loading = false;
let loadPromise: Promise<unknown> | null = null;

export const useXLSX = () => {
  const [isReady, setIsReady] = useState(!!exceljsModule);

  useEffect(() => {
    if (exceljsModule || loading) return;

    loading = true;
    if (!loadPromise) {
      loadPromise = import('exceljs').then((module) => {
        // ExcelJS puede exportarse como default o como named export
        exceljsModule = module.default || module;
        loading = false;
        setIsReady(true);
        return exceljsModule;
      }).catch((error) => {
        console.error('Error loading exceljs:', error);
        loading = false;
        throw error;
      });
    } else {
      loadPromise.then(() => setIsReady(true));
    }
  }, []);

  return { xlsx: exceljsModule, isReady };
};

