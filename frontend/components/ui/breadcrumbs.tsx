'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    const pathMap: Record<string, string> = {
      'inventory': 'Inventario',
      'movements': 'Movimientos',
      'donations': 'Donaciones',
      'products': 'Productos',
      'warehouses': 'Almacenes',
      'kitchen': 'Cocina',
      'bazar': 'Bazar',
      'reports': 'Reportes',
      'kpis': 'KPIs',
      'users': 'Usuarios',
      'settings': 'Configuración'
    };

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Don't add the last segment if it's the current page (no href)
      if (index === segments.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-gray-500', className)}>
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-foundation-orange transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {breadcrumb.href ? (
            <Link 
              href={breadcrumb.href}
              className="hover:text-foundation-orange transition-colors"
            >
              {breadcrumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">
              {breadcrumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
