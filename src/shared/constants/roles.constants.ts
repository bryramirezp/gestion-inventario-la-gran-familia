export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  OPERADOR: 'Operador',
  CONSULTOR: 'Consultor',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

export const ROLE_PERMISSIONS = {
  // Roles that can access stock alerts
  STOCK_ALERTS: [ROLES.ADMINISTRADOR, ROLES.OPERADOR, ROLES.CONSULTOR],
  
  // Roles that can access inventory and donations
  INVENTORY_ACCESS: [ROLES.ADMINISTRADOR, ROLES.OPERADOR],
  
  // Roles that can access administration
  ADMIN_ACCESS: [ROLES.ADMINISTRADOR],
} as const;
