#!/usr/bin/env python3
"""
Fase 2: Migrar App y Providers
===============================
Mueve App.tsx y los contextos (providers) a la nueva estructura.
"""

import os
import sys
import shutil
from pathlib import Path

# Directorio raíz del proyecto
ROOT_DIR = Path(__file__).parent.parent

# Mapeo de archivos a mover
FILES_TO_MOVE = {
    # App.tsx
    "App.tsx": "src/app/App.tsx",
    
    # Providers (renombrar contextos a providers)
    "contexts/AuthContext.tsx": "src/app/providers/AuthProvider.tsx",
    "contexts/ThemeContext.tsx": "src/app/providers/ThemeProvider.tsx",
    "contexts/NotificationContext.tsx": "src/app/providers/NotificationProvider.tsx",
    "contexts/AlertContext.tsx": "src/app/providers/AlertProvider.tsx",
    "contexts/QueryProvider.tsx": "src/app/providers/QueryProvider.tsx",
}


def move_file(source, destination, dry_run=False):
    """Mueve un archivo de source a destination."""
    source_path = ROOT_DIR / source
    dest_path = ROOT_DIR / destination
    
    if not source_path.exists():
        return False, f"Archivo fuente no existe: {source}"
    
    if dest_path.exists():
        return False, f"Archivo destino ya existe: {destination}"
    
    if dry_run:
        print(f"[MOVE] {source} -> {destination}")
        return True, None
    else:
        try:
            # Crear directorio destino si no existe
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Mover archivo
            shutil.move(str(source_path), str(dest_path))
            print(f"[MOVE] {source} -> {destination}")
            return True, None
        except Exception as e:
            return False, f"Error moviendo {source}: {e}"


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fase 2: Migrar App y Providers")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula la ejecución sin mover archivos"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("FASE 2: MIGRAR APP Y PROVIDERS")
    print("=" * 60)
    print(f"Directorio raíz: {ROOT_DIR}")
    print(f"Modo: {'DRY RUN' if args.dry_run else 'EJECUCIÓN REAL'}")
    print()
    
    moved = []
    skipped = []
    errors = []
    
    for source, destination in FILES_TO_MOVE.items():
        success, error = move_file(source, destination, dry_run=args.dry_run)
        
        if success:
            moved.append((source, destination))
        elif error:
            if "no existe" in error:
                skipped.append((source, destination))
                print(f"[SKIP] {source} (no existe)")
            elif "ya existe" in error:
                skipped.append((source, destination))
                print(f"[SKIP] {destination} (ya existe)")
            else:
                errors.append((source, destination, error))
                print(f"[ERROR] {error}")
    
    print()
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"Archivos movidos: {len(moved)}")
    print(f"Archivos omitidos: {len(skipped)}")
    print(f"Errores: {len(errors)}")
    
    if errors:
        print("\nErrores encontrados:")
        for source, dest, error in errors:
            print(f"  - {source}: {error}")
        return 1
    
    if args.dry_run:
        print("\n⚠️  Modo DRY RUN - No se movieron archivos")
        print("   Ejecuta sin --dry-run para mover los archivos")
    else:
        print("\n✅ Migración de App y Providers completada")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

