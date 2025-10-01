# Sistema de Inventario - Fundación La Gran Familia

Un sistema integral de gestión de inventario desarrollado con Next.js 13, diseñado específicamente para fundaciones y organizaciones sin fines de lucro.

## 🚀 Características

- **Dashboard Principal**: Vista general con KPIs y métricas importantes
- **Gestión de Inventario**: Control completo de productos y stock
- **Gestión de Almacenes**: Administración de múltiples ubicaciones
- **Movimientos**: Registro de entradas y salidas de productos
- **Donaciones**: Seguimiento de donaciones recibidas
- **Cocina**: Gestión específica para área de cocina
- **Bazar**: Control de productos para venta
- **Usuarios**: Administración de usuarios y permisos
- **Reportes**: Generación de reportes y análisis
- **Configuración**: Panel de configuración del sistema

## 🛠️ Tecnologías Utilizadas

- **Next.js 13** - Framework de React con App Router
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework de CSS utilitario
- **Radix UI** - Componentes de interfaz accesibles
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **JWT** - Autenticación con tokens
- **bcryptjs** - Encriptación de contraseñas
- **Recharts** - Gráficos y visualizaciones

## 📋 Prerrequisitos

- Node.js 18.0 o superior
- npm o yarn
- Git

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd project
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos (si se requiere)
DATABASE_URL="tu-url-de-base-de-datos"

# JWT Secret
JWT_SECRET="tu-secreto-jwt-muy-seguro"

# Configuración de la aplicación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-nextauth"

# Otras variables según necesidades
```

### 4. Ejecutar en modo desarrollo
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
project/
├── app/                    # Páginas y rutas de la aplicación
│   ├── api/               # API routes
│   │   └── auth/          # Endpoints de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── inventory/         # Gestión de inventario
│   ├── warehouses/        # Gestión de almacenes
│   ├── movements/         # Movimientos de stock
│   ├── donations/         # Gestión de donaciones
│   ├── kitchen/           # Área de cocina
│   ├── bazar/             # Gestión de bazar
│   ├── users/             # Administración de usuarios
│   ├── reports/           # Reportes y análisis
│   └── settings/          # Configuración
├── components/            # Componentes reutilizables
│   ├── layout/            # Componentes de layout
│   └── ui/                # Componentes de interfaz
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades y configuraciones
└── middleware.ts          # Middleware de Next.js
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter de ESLint

## 🔐 Autenticación

El sistema incluye un sistema de autenticación completo con:
- Login/logout
- Protección de rutas
- Middleware de autenticación
- Gestión de sesiones con JWT

## 🎨 Interfaz de Usuario

- Diseño responsive y moderno
- Componentes accesibles con Radix UI
- Tema claro/oscuro (preparado para implementar)
- Iconos con Lucide React

## 📊 Funcionalidades Principales

### Dashboard
- KPIs principales
- Gráficos de tendencias
- Resumen de actividades recientes

### Inventario
- CRUD completo de productos
- Control de stock
- Categorización de productos
- Búsqueda y filtros

### Almacenes
- Gestión de múltiples ubicaciones
- Control de capacidad
- Asignación de productos

### Movimientos
- Registro de entradas y salidas
- Historial completo
- Trazabilidad de productos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para Fundación La Gran Familia**
