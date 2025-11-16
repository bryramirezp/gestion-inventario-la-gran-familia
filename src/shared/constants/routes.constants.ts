export const ROUTES = {
  // Public routes
  LANDING: '/landing',
  LOGIN: '/login',
  CONFIRM_EMAIL: '/ConfirmEmail',
  FORGOT_PASSWORD: '/forgot-password',
  UPDATE_PASSWORD: '/update-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Inventory and Donations
  PRODUCTS: '/products',
  DONATIONS: '/donations',
  DONORS: '/donors',
  DONOR_DETAIL: '/donors/:id',
  WAREHOUSES: '/warehouses',
  WAREHOUSE_DETAIL: '/warehouses/:id',
  
  // Administration
  CATEGORIES: '/categories',
  BRANDS: '/brands',
  USERS: '/users',
  BACKUP: '/backup',
  
  // Reports
  EXPIRY_REPORT: '/expiry-report',
  DONOR_ANALYSIS: '/donor-analysis',
  
  // Movements and Transfers
  MOVEMENTS: '/movements',
  MOVEMENT_TYPES: '/movement-types',
  TRANSFERS_REQUEST: '/transfers/request',
  TRANSFERS_APPROVE: '/transfers/approve',
  TRANSFERS_HISTORY: '/transfers/history',
  ADJUSTMENTS_APPROVE: '/adjustments/approve',
  ADJUSTMENTS_HISTORY: '/adjustments/history',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
