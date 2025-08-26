# Sistema de Gestión de Inventario para "La Gran Familia"

Este proyecto es una aplicación web moderna diseñada para gestionar el inventario de donaciones (entradas y salidas) de la ONG "La Gran Familia".

El sistema utiliza un backend serverless a través de Supabase y un frontend reactivo que puede ser desplegado fácilmente en plataformas como Vercel o GitHub Pages.

## **Acerca de La Gran Familia**

**Historia**

La Gran Familia nació en la década de los ochenta como un esfuerzo conjunto de empresarios, encabezados por Don Alberto Santos de Hoyos, y el gobierno de Nuevo León, para asegurar que no hubiera niños en situación de calle en el estado. Hoy en día, la organización acoge a niños cuyas familias no les han ofrecido la protección que merecen, habiendo albergado a aproximadamente 2200 menores de edad a lo largo de su historia.

**Misión**

Brindar a menores de edad privados de cuidados parentales, un acogimiento residencial inspirado por valores y habilidades familiares que encienda en ellos la esperanza y les prepare para un proyecto de vida en familia.

**Visión**

A niñas, niños y adolescentes privados de cuidados parentales, se les incorpora en una familia que promueve su desarrollo integral como hombres y mujeres capaces de formar familias en armonía.

**Sitio Web Oficial**

https://www.lagranfamilia.org.mx/

## **Contexto del Proyecto**

**1. La Necesidad (El porqué del proyecto)**

La necesidad principal es la **falta de control y la ineficiencia en la gestión del almacén**. El problema de raíz es que los procesos actuales están desconectados y son manuales:

* Las entradas de donativos se registran en Excel.
* Las salidas de productos del almacén se apuntan a mano.

Esta falta de un sistema unificado provoca que sea muy difícil saber con exactitud qué tienen, cuánto les queda y cómo se están utilizando los recursos. Esto es crítico para una organización que debe garantizar la alimentación e higiene de los niños a su cargo.

**2. Lo que Justifica el Proyecto**

El proyecto se justifica por el deseo de **profesionalizar y estandarizar la operación del almacén**. La gestión actual, al ser manual y desorganizada, no es sostenible ni fiable. La justificación se basa en alcanzar objetivos concretos que resolverán los problemas actuales:

* **Centralizar la Información:** Crear una única base de datos para saber exactamente qué hay en el inventario.
* **Mejorar la Organización:** Clasificar todos los productos por categorías (alimentación, limpieza, ropa, etc.) para facilitar la búsqueda y el control.
* **Aumentar la Trazabilidad:** Implementar un sistema de validación, como una firma digital, para tener un registro claro de quién retira los materiales y cuándo.
* **Control Financiero:** Añadir una función para monitorear los gastos de la organización.

**3. La Razón del Proyecto (El Objetivo Final)**

La razón fundamental del proyecto es implementar una solución que sea **sencilla, intuitiva y gratuita**. El objetivo no es simplemente digitalizar, sino hacerlo de una manera que se adapte a las necesidades y limitaciones de la ONG. La filosofía es clara: **"que el sistema trabaje para ellos, no ellos para el sistema"**.

En resumen, no quieren un sistema complejo y caro como un ERP. Buscan una herramienta inteligente y de bajo mantenimiento que les dé el control que necesitan sobre sus recursos para que puedan enfocarse en su misión principal: cuidar a los niños.

## 📜 Tecnologías Principales

- **Backend:** Supabase (Base de datos PostgreSQL, Autenticación, APIs automáticas)
- **Frontend:** JavaScript, con un framework como Vue.js o React
- **Alojamiento (Hosting):** Vercel (Recomendado) o GitHub Pages
- **Control de Versiones:** Git y GitHub

## ✅ Beneficios de esta Arquitectura

**Costo Cero:** Todo el stack tecnológico, desde la base de datos hasta el hosting, puede operar bajo generosos planes gratuitos, ideales para una ONG.

**Escalable y Moderno:** La arquitectura "serverless" permite que el sistema crezca sin necesidad de administrar servidores. El rendimiento es excelente.

**Mantenimiento Sencillo:** Las actualizaciones del frontend se despliegan automáticamente y la base de datos es gestionada por Supabase, reduciendo la carga de mantenimiento.

**Desarrollo Rápido:** Supabase autogenera las APIs, lo que permite que el desarrollo se centre casi exclusivamente en la experiencia del usuario (frontend).

## ⚠️ Desafíos en la Construcción

**Curva de Aprendizaje:** Es necesario familiarizarse con el framework de frontend elegido (Vue/React) y entender los conceptos básicos de Supabase, especialmente la seguridad.

**Seguridad de Datos (RLS):** El desafío más importante es configurar correctamente la Seguridad a Nivel de Fila (Row Level Security) en Supabase. Es crucial definir políticas que aseguren que los usuarios solo puedan ver y modificar los datos que les corresponden.

**Gestión del Estado:** A medida que la aplicación crece, manejar el "estado" (los datos que se muestran y actualizan en la interfaz) en el frontend puede volverse complejo.

**Funcionalidad Offline:** Este sistema depende de una conexión a internet. Implementar un soporte offline robusto requeriría una lógica de sincronización de datos considerablemente más avanzada.

## 🚀 Guía de Implementación Paso a Paso

### Fase 1: Configuración del Backend (Supabase)

1. **Crear Proyecto:** Regístrate en Supabase y crea un nuevo proyecto. Guarda bien la contraseña de tu base de datos.

2. **Diseñar Tablas:** Usa el "Table Editor" para crear tus tablas. Como mínimo, necesitarás:
   - `articulos` (id, nombre, descripcion, stock_actual)
   - `movimientos` (id, articulo_id, tipo_movimiento, cantidad, fecha)

3. **Implementar Seguridad (¡Crítico!):**
   - Ve a Authentication > Policies
   - Deshabilita el acceso público a las tablas por defecto
   - Crea Políticas de Seguridad (RLS) para permitir operaciones SELECT, INSERT, UPDATE solo a usuarios autenticados. Por ejemplo:
   ```sql
   CREATE POLICY "Permitir acceso a usuarios autenticados" ON movimientos FOR ALL USING (auth.role() = 'authenticated');
   ```

4. **Obtener las Keys:** Ve a Project Settings > API. Copia tu URL y tu anon public key. Las necesitarás para el frontend.

### Fase 2: Desarrollo del Frontend

1. **Entorno Local:** Asegúrate de tener Node.js instalado. Usa la terminal para crear un nuevo proyecto de Vue o React.
   ```bash
   # Para Vue.js
   npm create vue@latest
   ```

2. **Instalar Cliente de Supabase:** Dentro de la carpeta de tu proyecto, instala la librería cliente de Supabase.
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Conectar con Supabase:** Crea un archivo de configuración (ej. `src/supabase.js`) donde inicializarás el cliente de Supabase con la URL y la anon key que copiaste en la Fase 1.

4. **Construir la Interfaz:** Desarrolla los componentes visuales:
   - Un formulario para registrar entradas y salidas (INSERT en la tabla `movimientos`)
   - Una tabla o lista para mostrar el inventario actual (SELECT de la tabla `articulos`)

5. **Guardar en GitHub:** Inicializa un repositorio de Git, y sube tu código a GitHub.
   ```bash
   git init
   git add .
   git commit -m "Versión inicial del sistema de inventario"
   # Sigue las instrucciones de GitHub para subir tu repositorio
   ```

### Fase 3: Despliegue en la Nube (Deployment)

#### Opción A: Vercel (Recomendada)

1. **Crear Cuenta:** Regístrate en Vercel con tu cuenta de GitHub.

2. **Importar Proyecto:** En tu dashboard de Vercel, haz clic en "Add New... > Project" e importa el repositorio de GitHub que creaste.

3. **Configurar Variables de Entorno:** Vercel detectará tu framework. Durante la configuración, ve a la sección "Environment Variables". Aquí debes añadir de forma segura tu URL y anon key de Supabase para que no queden expuestas en el código.
   - `VUE_APP_SUPABASE_URL` = (tu URL de Supabase)
   - `VUE_APP_SUPABASE_ANON_KEY` = (tu anon key de Supabase)

4. **Desplegar:** Haz clic en "Deploy". Vercel construirá tu aplicación y la publicará en una URL. A partir de ahora, cada vez que hagas `git push` a tu rama principal en GitHub, Vercel redesplegará los cambios automáticamente.

#### Opción B: GitHub Pages (Para proyectos más simples)

1. **Configurar en GitHub:** En tu repositorio de GitHub, ve a Settings > Pages.

2. **Seleccionar Fuente:** Elige la rama que quieres desplegar (usualmente `main`).

3. **Publicar:** GitHub Pages construirá tu sitio y te dará una URL (`tunombredeusuario.github.io/tu-repositorio`).

> **Nota sobre Seguridad:** Gestionar las "API keys" en GitHub Pages de forma segura es más complicado que en Vercel. Por esta razón, Vercel es la opción superior para cualquier aplicación que necesite claves de API.
