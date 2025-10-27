# Sistema de Gestión de Inventario para "La Gran Familia"

Este proyecto es una aplicación web moderna diseñada para gestionar el inventario de donaciones (entradas y salidas) de la ONG "La Gran Familia".

El sistema utiliza un backend serverless a través de Supabase y un frontend reactivo que puede ser desplegado fácilmente en plataformas como Vercel o GitHub Pages.

## 🛠️ Tecnologías Utilizadas

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black) ![Husky](https://img.shields.io/badge/Husky-4E4E4E?style=for-the-badge&logo=husky&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

### **Descripción del Stack Tecnológico**

- **Frontend: React 18.3.1 + TypeScript** - Biblioteca para construir interfaces de usuario con componentes reutilizables y tipado fuerte para mayor robustez.
- **Build Tool: Vite 7.1.12** - Herramienta de construcción rápida y moderna para desarrollo y empaquetado de aplicaciones web.
- **Styling: Tailwind CSS 3.4.18 + componentes SVG personalizados** - Framework CSS utilitario para estilos rápidos y consistentes, complementado con iconos SVG personalizados.
- **State Management: TanStack React Query 5.59.16 + Context API** - Gestión de estado del servidor y caché de datos, combinado con Context API para estado global de la aplicación.
- **Backend: Supabase 2.76.1 (PostgreSQL + Auth + Realtime)** - Plataforma backend-as-a-service con base de datos PostgreSQL, autenticación y actualizaciones en tiempo real.
- **Routing: React Router DOM 6.30.1** - Manejo de navegación y rutas en la aplicación de una sola página.
- **Charts: Recharts 2.15.4** - Biblioteca para crear gráficos interactivos y responsivos en React.
- **Development: ESLint, Prettier, Husky, PWA (Service Worker)** - Herramientas para linting de código, formateo automático, hooks de Git y funcionalidad offline mediante Progressive Web App.

## **Acerca de La Gran Familia**

### **Historia**

La Gran Familia nació en la década de los ochenta como un esfuerzo conjunto de empresarios, encabezados por Don Alberto Santos de Hoyos, y el gobierno de Nuevo León, para asegurar que no hubiera niños en situación de calle en el estado. Hoy en día, la organización acoge a niños cuyas familias no les han ofrecido la protección que merecen, habiendo albergado a aproximadamente 2200 menores de edad a lo largo de su historia.

### **Misión**

Brindar a menores de edad privados de cuidados parentales, un acogimiento residencial inspirado por valores y habilidades familiares que encienda en ellos la esperanza y les prepare para un proyecto de vida en familia.

### **Visión**

A niñas, niños y adolescentes privados de cuidados parentales, se les incorpora en una familia que promueve su desarrollo integral como hombres y mujeres capaces de formar familias en armonía.

### **Sitio Web Oficial**

https://www.lagranfamilia.org.mx/

## **Contexto del Proyecto**

### **1. La Necesidad (El porqué del proyecto)**

La necesidad principal es la **falta de control y la ineficiencia en la gestión del almacén**. El problema de raíz es que los procesos actuales están desconectados y son manuales:

* Las entradas de donativos se registran en Excel.
* Las salidas de productos del almacén se apuntan a mano.

Esta falta de un sistema unificado provoca que sea muy difícil saber con exactitud qué tienen, cuánto les queda y cómo se están utilizando los recursos. Esto es crítico para una organización que debe garantizar la alimentación e higiene de los niños a su cargo.

### **2. Lo que Justifica el Proyecto**

El proyecto se justifica por el deseo de **profesionalizar y estandarizar la operación del almacén**. La gestión actual, al ser manual y desorganizada, no es sostenible ni fiable. La justificación se basa en alcanzar objetivos concretos que resolverán los problemas actuales:

* **Centralizar la Información:** Crear una única base de datos para saber exactamente qué hay en el inventario.
* **Mejorar la Organización:** Clasificar todos los productos por categorías (alimentación, limpieza, ropa, etc.) para facilitar la búsqueda y el control.
* **Aumentar la Trazabilidad:** Implementar un sistema de validación, como una firma digital, para tener un registro claro de quién retira los materiales y cuándo.
* **Control Financiero:** Añadir una función para monitorear los gastos de la organización.

### **3. La Razón del Proyecto (El Objetivo Final)**

La razón fundamental del proyecto es implementar una solución que sea **sencilla, intuitiva y gratuita**. El objetivo no es simplemente digitalizar, sino hacerlo de una manera que se adapte a las necesidades y limitaciones de la ONG. La filosofía es clara: **"que el sistema trabaje para ellos, no ellos para el sistema"**.

En resumen, no quieren un sistema complejo y caro como un ERP. Buscan una herramienta inteligente y de bajo mantenimiento que les dé el control que necesitan sobre sus recursos para que puedan enfocarse en su misión principal: cuidar a los niños.

## **Cronograma del Proyecto**

**Duración Total:** 26 de agosto - 11 de noviembre (2024)

Este cronograma refleja las actividades realmente ejecutadas en el proyecto, divididas en tres fases principales que incluyen todos los entregables académicos requeridos.

### **Fase 1: Diagnóstico y Planificación Inicial** *(26 de agosto - 9 de septiembre)*

Esta fase se enfocó en establecer el contacto con la ONG, realizar el diagnóstico de necesidades y formalizar la colaboración.

| N° | Actividad | Responsable | Fecha de Inicio | Fecha de Fin | Entregable |
|----|-----------|-------------|-----------------|--------------|------------|
| **1.1** | Detallar la documentación inicial | Equipo | 26/ago | 02/sep | Diagnóstico completado |
| **1.2** | Realizar diagnóstico con la ONG | Equipo | 26/ago | 09/sep | Definición final de tablas y políticas de seguridad |
| **1.3** | Entregar formato de acuerdo | Equipo | 02/sep | 09/sep | 📋 **Formato de acuerdo de colaboración firmado** |

### **Fase 2: Desarrollo y Configuración del Sistema** *(10 de septiembre - 21 de octubre)*

Con el diagnóstico completado, el equipo se enfocó en construir la infraestructura técnica del sistema y desarrollar las funcionalidades principales.

| N° | Actividad | Responsable | Fecha de Inicio | Fecha de Fin | Entregable |
|----|-----------|-------------|-----------------|--------------|------------|
| **2.1** | Configurar entorno de desarrollo | Equipo | 10/sep | 16/sep | Repositorio en GitHub y entorno local |
| **2.2** | Crear y configurar proyecto en Supabase | Equipo | 10/sep | 23/sep | Proyecto en Supabase creado |
| **2.3** | Conectar frontend con Supabase | Equipo | 17/sep | 30/sep | Conexión exitosa a la API |
| **2.4** | Diseñar e implementar base de datos | Equipo | 24/sep | 07/oct | Estructura de la base de datos finalizada |
| **2.5** | Desarrollar componentes UI | Equipo | 01/oct | 14/oct | Vistas para registrar y ver inventario |
| **2.6** | Implementar Seguridad (RLS) | Equipo | 08/oct | 21/oct | Políticas de acceso implementadas |
| **2.7** | Preparar Project Charter | Equipo | 15/oct | 21/oct | Project Charter |
| **2.8** | Entregar Project Charter | Equipo | 21/oct | 21/oct | 📋 **Project Charter (21 de octubre)** |

### **Fase 3: Pruebas, Despliegue y Cierre** *(22 de octubre - 11 de noviembre)*

La fase final se centró en validar el sistema, desplegarlo en producción y completar toda la documentación de cierre del proyecto.

| N° | Actividad | Responsable | Fecha de Inicio | Fecha de Fin | Entregable |
|----|-----------|-------------|-----------------|--------------|------------|
| **3.1** | Realizar pruebas funcionales | Equipo | 22/oct | 28/oct | Funcionalidades validadas |
| **3.2** | Preparar reporte de avance | Equipo | 29/oct | 04/nov | Reporte de estado del proyecto |
| **3.3** | Desplegar la aplicación | Equipo | 22/oct | 11/nov | Aplicación en URL pública |
| **3.4** | Elaborar documentación final | Equipo | 05/nov | 11/nov | 📋 **Evaluación del servicio y Lecciones aprendidas (11 de noviembre)** |
| **3.5** | Preparar informe de cierre | Equipo | 05/nov | 11/nov | Informe de cierre del proyecto |
| **3.6** | Preparar la presentación final | Equipo | 05/nov | 11/nov | 🎯 **Presentación de resultados (Fecha examen final)** |

### **Hitos Clave del Proyecto**

| Hito | Fecha | Estado |
|------|-------|--------|
| ⭐ Inicio de contacto con la ONG | 26 de agosto | ✅ Completado |
| 📋 Formato de acuerdo de colaboración | 9 de septiembre | ✅ Entregado |
| 📋 Project Charter | 21 de octubre | 🔄 En ejecución |
| 🚀 Despliegue del proyecto | 22 octubre - 9 noviembre | 📅 Programado |
| 📋 Evaluación del servicio | 11 de noviembre | 📅 Programado |
| 🎯 Presentación final | Fecha examen final | 📅 Programado |
