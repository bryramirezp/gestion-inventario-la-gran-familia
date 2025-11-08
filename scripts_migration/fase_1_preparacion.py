#!/usr/bin/env python3
"""
Fase 1: Preparación de Estructura
==================================
Crea la estructura de carpetas nueva en src/ según la arquitectura por capas.
"""

import os
import sys
from pathlib import Path

# Directorio raíz del proyecto
ROOT_DIR = Path(__file__).parent.parent

# Estructura de directorios a crear
DIRECTORIES = [
    # App
    "src/app/providers",
    
    # Presentation
    "src/presentation/components/ui",
    "src/presentation/components/forms",
    "src/presentation/components/layout",
    "src/presentation/components/icons",
    "src/presentation/components/animated",
    "src/presentation/pages/auth",
    "src/presentation/pages/dashboard",
    "src/presentation/pages/products",
    "src/presentation/pages/donations",
    "src/presentation/pages/donors",
    "src/presentation/pages/warehouses",
    "src/presentation/pages/kitchen",
    "src/presentation/pages/users",
    "src/presentation/pages/profile",
    "src/presentation/pages/categories",
    "src/presentation/pages/brands",
    "src/presentation/pages/reports",
    "src/presentation/pages/backup",
    "src/presentation/pages/landing",
    "src/presentation/features/donations",
    "src/presentation/features/products",
    "src/presentation/features/shared",
    "src/presentation/styles",
    
    # Domain
    "src/domain/entities",
    "src/domain/services",
    "src/domain/types",
    
    # Data
    "src/data/repositories",
    "src/data/api",
    "src/data/validation",
    
    # Infrastructure
    "src/infrastructure/config",
    "src/infrastructure/utils",
    "src/infrastructure/hooks/charts",
    
    # Shared
    "src/shared/constants",
    "src/shared/types",
]


def create_directories(dry_run=False):
    """Crea todos los directorios necesarios."""
    created = []
    skipped = []
    errors = []
    
    for directory in DIRECTORIES:
        dir_path = ROOT_DIR / directory
        
        if dry_run:
            if dir_path.exists():
                print(f"[SKIP] {directory} (ya existe)")
                skipped.append(directory)
            else:
                print(f"[CREATE] {directory}")
                created.append(directory)
        else:
            try:
                if dir_path.exists():
                    print(f"[SKIP] {directory} (ya existe)")
                    skipped.append(directory)
                else:
                    dir_path.mkdir(parents=True, exist_ok=True)
                    print(f"[CREATE] {directory}")
                    created.append(directory)
            except Exception as e:
                error_msg = f"Error creando {directory}: {e}"
                print(f"[ERROR] {error_msg}")
                errors.append(error_msg)
    
    return created, skipped, errors


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fase 1: Crear estructura de directorios")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula la ejecución sin crear directorios"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("FASE 1: PREPARACIÓN DE ESTRUCTURA")
    print("=" * 60)
    print(f"Directorio raíz: {ROOT_DIR}")
    print(f"Modo: {'DRY RUN' if args.dry_run else 'EJECUCIÓN REAL'}")
    print()
    
    created, skipped, errors = create_directories(dry_run=args.dry_run)
    
    print()
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"Directories creados: {len(created)}")
    print(f"Directories existentes: {len(skipped)}")
    print(f"Errores: {len(errors)}")
    
    if errors:
        print("\nErrores encontrados:")
        for error in errors:
            print(f"  - {error}")
        return 1
    
    if args.dry_run:
        print("\n⚠️  Modo DRY RUN - No se crearon directorios")
        print("   Ejecuta sin --dry-run para crear los directorios")
    else:
        print("\n✅ Estructura de directorios creada exitosamente")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

