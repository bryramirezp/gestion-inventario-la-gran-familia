export const APP_CONSTANTS = {
  // Warehouse constants
  EXPIRED_WAREHOUSE_ID: 999,
  
  // Notification constants
  EXPIRY_ALERT_DAYS: 30,
  
  // Default values
  DEFAULT_LOW_STOCK_THRESHOLD: 5,
  
  // LocalStorage keys
  LOCAL_STORAGE_KEYS: {
    READ_NOTIFICATIONS: 'inventory-read-notifications',
    THEME: 'theme',
  },
  
  // Date formats
  DATE_FORMATS: {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
  },
} as const;
