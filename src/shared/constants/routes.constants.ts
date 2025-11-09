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
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
