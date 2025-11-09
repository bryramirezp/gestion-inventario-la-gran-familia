/**
 * Configuración de caching para React Query
 * Define diferentes estrategias de caching según el tipo de dato
 */

export enum CacheStrategy {
  /**
   * Datos estáticos que raramente cambian (categorías, marcas, unidades, roles)
   * - staleTime: 30 minutos
   * - gcTime: 1 hora
   */
  STATIC = 'STATIC',

  /**
   * Datos semi-estáticos que cambian ocasionalmente (almacenes, donantes)
   * - staleTime: 10 minutos
   * - gcTime: 30 minutos
   */
  SEMI_STATIC = 'SEMI_STATIC',

  /**
   * Datos dinámicos que cambian frecuentemente (productos, transacciones, donaciones)
   * - staleTime: 2 minutos
   * - gcTime: 10 minutos
   */
  DYNAMIC = 'DYNAMIC',

  /**
   * Datos en tiempo real que cambian constantemente (notificaciones, stock actual)
   * - staleTime: 1 minuto
   * - gcTime: 5 minutos
   */
  REALTIME = 'REALTIME',
}

/**
 * Configuraciones de caching por estrategia
 */
export const cacheConfigs = {
  [CacheStrategy.STATIC]: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  [CacheStrategy.SEMI_STATIC]: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  [CacheStrategy.DYNAMIC]: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  [CacheStrategy.REALTIME]: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
};

/**
 * Mapeo de queryKeys a estrategias de caching
 * Esto permite determinar automáticamente la estrategia basada en el queryKey
 */
export const getCacheStrategy = (queryKey: string[]): CacheStrategy => {
  const key = queryKey[0]?.toLowerCase() || '';

  // Datos estáticos
  if (
    key === 'categories' ||
    key === 'brands' ||
    key === 'units' ||
    key === 'roles' ||
    key === 'donor-types'
  ) {
    return CacheStrategy.STATIC;
  }

  // Datos semi-estáticos
  if (key === 'warehouses' || key === 'donors') {
    return CacheStrategy.SEMI_STATIC;
  }

  // Datos en tiempo real
  if (key === 'notifications' || key === 'stock') {
    return CacheStrategy.REALTIME;
  }

  // Datos dinámicos (por defecto)
  return CacheStrategy.DYNAMIC;
};

/**
 * Obtener configuración de caching para una queryKey
 */
export const getCacheConfig = (queryKey: string[]) => {
  const strategy = getCacheStrategy(queryKey);
  return cacheConfigs[strategy];
};
