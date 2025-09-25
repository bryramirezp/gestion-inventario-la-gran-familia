import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here'
);

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'employee';
  warehouses: string[];
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Mock users database - In production, this would come from a real database
const users: (User & { password: string })[] = [
  {
    id: '1',
    email: 'lorena@fundacion.org',
    name: 'Lorena',
    role: 'super_admin',
    warehouses: [],
    password: '$2b$12$2TDGH5tGNjywQnlM9n.dduKHJyN2U2yKh7WJxw5t1SHoOJYxkBh9i', // password: admin123
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'lilith@fundacion.org',
    name: 'Lilith',
    role: 'super_admin',
    warehouses: [],
    password: '$2b$12$0TgGZ.3RTNz9pzhfIW5lKes0jzPSKmVjUN/Jj9keDPywkKrb8kcuy', // password: admin123
    createdAt: new Date(),
  },
  {
    id: '3',
    email: 'empleado@fundacion.org',
    name: 'Empleado Demo',
    role: 'employee',
    warehouses: ['cocina', 'bazar'],
    password: '$2b$12$JIGMG23MHqp1h0RwXCTmauPnoZp8ZhmC15eywb.R9uo5mM10CyVxq', // password: admin123
    createdAt: new Date(),
  },
];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function signToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function authenticate(credentials: LoginCredentials): Promise<User | null> {
  const user = users.find(u => u.email === credentials.email);
  if (!user) return null;

  const isValid = await verifyPassword(credentials.password, user.password);
  if (!isValid) return null;

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function getUserById(id: string): User | null {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function hasWarehouseAccess(user: User, warehouseId: string): boolean {
  if (user.role === 'super_admin') return true;
  return user.warehouses.includes(warehouseId);
}