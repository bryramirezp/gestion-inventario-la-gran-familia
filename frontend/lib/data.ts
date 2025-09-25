export interface Warehouse {
  id: string;
  name: string;
  type: 'cocina' | 'bazar' | 'almacen_general';
  description: string;
  createdAt: Date;
  managerId: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
  averagePrice: number;
  priceHistory: PriceHistory[];
  createdAt: Date;
}

export interface PriceHistory {
  price: number;
  date: Date;
  source: 'donation' | 'purchase' | 'adjustment';
  donationId?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  expirationDate?: Date;
  batchNumber?: string;
  donationId?: string;
  entryDate: Date;
  minStock: number;
  maxStock: number;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  items: DonationItem[];
  totalValue: number;
  receiptNumber?: string;
  date: Date;
  receivedBy: string;
}

export interface DonationItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  expirationDate?: Date;
  batchNumber?: string;
}

export interface Movement {
  id: string;
  type: 'entry' | 'exit' | 'transfer';
  productId: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  quantity: number;
  reason: string;
  performedBy: string;
  signature?: string;
  date: Date;
  notes?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  period: 'daily' | 'weekly' | 'monthly';
  category: 'consumption' | 'waste' | 'efficiency' | 'cost';
  warehouseId?: string;
  date: Date;
}

// Mock data
export const warehouses: Warehouse[] = [
  {
    id: 'cocina',
    name: 'Cocina',
    type: 'cocina',
    description: 'Almacén principal de la cocina comunitaria',
    createdAt: new Date('2024-01-01'),
    managerId: '1',
  },
  {
    id: 'bazar',
    name: 'Bazar',
    type: 'bazar',
    description: 'Punto de venta y distribución',
    createdAt: new Date('2024-01-01'),
    managerId: '2',
  },
  {
    id: 'almacen-general',
    name: 'Almacén General',
    type: 'almacen_general',
    description: 'Almacén de productos generales',
    createdAt: new Date('2024-01-01'),
    managerId: '1',
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Arroz',
    category: 'Granos',
    unit: 'kg',
    description: 'Arroz blanco de grano largo',
    averagePrice: 2.5,
    priceHistory: [
      { price: 2.3, date: new Date('2024-01-01'), source: 'donation' },
      { price: 2.7, date: new Date('2024-01-15'), source: 'donation' },
    ],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Frijoles',
    category: 'Legumbres',
    unit: 'kg',
    description: 'Frijoles negros',
    averagePrice: 3.2,
    priceHistory: [
      { price: 3.0, date: new Date('2024-01-01'), source: 'donation' },
      { price: 3.4, date: new Date('2024-01-10'), source: 'donation' },
    ],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Aceite de Cocina',
    category: 'Aceites',
    unit: 'litro',
    description: 'Aceite vegetal para cocinar',
    averagePrice: 4.5,
    priceHistory: [
      { price: 4.2, date: new Date('2024-01-01'), source: 'donation' },
      { price: 4.8, date: new Date('2024-01-05'), source: 'donation' },
    ],
    createdAt: new Date('2024-01-01'),
  },
];

export const inventory: InventoryItem[] = [
  {
    id: '1',
    productId: '1',
    warehouseId: 'cocina',
    quantity: 50,
    expirationDate: new Date('2024-12-31'),
    batchNumber: 'ARR001',
    entryDate: new Date('2024-01-15'),
    minStock: 10,
    maxStock: 100,
  },
  {
    id: '2',
    productId: '2',
    warehouseId: 'cocina',
    quantity: 30,
    expirationDate: new Date('2025-06-30'),
    batchNumber: 'FRJ001',
    entryDate: new Date('2024-01-10'),
    minStock: 5,
    maxStock: 50,
  },
  {
    id: '3',
    productId: '3',
    warehouseId: 'bazar',
    quantity: 20,
    expirationDate: new Date('2024-08-15'),
    batchNumber: 'ACE001',
    entryDate: new Date('2024-01-05'),
    minStock: 5,
    maxStock: 30,
  },
];

export const donations: Donation[] = [
  {
    id: '1',
    donorName: 'Supermercado Central',
    donorEmail: 'donaciones@supercentral.com',
    donorPhone: '+1234567890',
    items: [
      { productId: '1', quantity: 25, unitPrice: 2.3, batchNumber: 'ARR001' },
      { productId: '2', quantity: 15, unitPrice: 3.0, batchNumber: 'FRJ001' },
    ],
    totalValue: 102.5,
    receiptNumber: 'FAC-001-2024',
    date: new Date('2024-01-15'),
    receivedBy: '1',
  },
];

export const movements: Movement[] = [
  {
    id: '1',
    type: 'entry',
    productId: '1',
    toWarehouseId: 'cocina',
    quantity: 25,
    reason: 'Donación recibida',
    performedBy: '1',
    date: new Date('2024-01-15'),
    notes: 'Donación de Supermercado Central',
  },
  {
    id: '2',
    type: 'transfer',
    productId: '3',
    fromWarehouseId: 'almacen-general',
    toWarehouseId: 'bazar',
    quantity: 10,
    reason: 'Reabastecimiento bazar',
    performedBy: '2',
    signature: 'Empleado Demo',
    date: new Date('2024-01-20'),
  },
];

export const kpis: KPI[] = [
  {
    id: '1',
    name: 'Consumo Diario Cocina',
    value: 15,
    target: 20,
    period: 'daily',
    category: 'consumption',
    warehouseId: 'cocina',
    date: new Date(),
  },
  {
    id: '2',
    name: 'Productos Próximos a Vencer',
    value: 3,
    target: 5,
    period: 'weekly',
    category: 'waste',
    date: new Date(),
  },
  {
    id: '3',
    name: 'Eficiencia de Almacén',
    value: 85,
    target: 90,
    period: 'monthly',
    category: 'efficiency',
    date: new Date(),
  },
];