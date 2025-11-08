# 🔒 INFORME DE AUDITORÍA DE SEGURIDAD CONSOLIDADO
## Sistema de Gestión de Inventario - La Gran Familia

**Fecha:** Diciembre 2024  
**Auditor:** Experto Senior en AppSec - Especialista en JAMstack/Serverless  
**Stack Analizado:** React 18.3.1, TypeScript, Vite, Supabase, Vercel  
**Dominio Auditado:** gestion-inventario-la-gran-familia.vercel.app

---

## 1. RESUMEN EJECUTIVO

La aplicación presenta un **estado de seguridad moderado con riesgos configurables de nivel medio-alto**. El principal foco de vulnerabilidades se concentra en la **configuración de Content Security Policy (CSP)** y cabeceras HTTP de seguridad. Aunque la aplicación utiliza cabeceras de seguridad básicas, la CSP actual es demasiado permisiva, permitiendo `unsafe-inline` y `unsafe-eval`, lo que anula parcialmente la protección contra ataques XSS. Adicionalmente, se detectaron configuraciones redundantes (CSP y X-Frame-Options definidos en meta tags y headers HTTP), un problema de CORS excesivamente permisivo, y la ausencia de HSTS en algunos assets estáticos. **La buena noticia es que todos estos hallazgos son corregibles mediante configuración en `vercel.json` y ajustes menores en el código**, sin requerir cambios arquitectónicos mayores.

---

## 2. HALLAZGOS CONSOLIDADOS Y PRIORIZADOS

| Prioridad | Hallazgo (Consolidado) | Severidad Scanner | Riesgo Real | Informes de Origen |
|:---|:---|:---:|:---:|:---|
| **🔴 ALTA** | CSP Inseguro: `script-src 'unsafe-inline'` y `'unsafe-eval'` | Media | **ALTA** | ZAP, PentestTools, HostedScan |
| **🔴 ALTA** | CSP Inseguro: `style-src 'unsafe-inline'` | Media | **MEDIA-ALTA** | ZAP, PentestTools, HostedScan |
| **🟡 MEDIA** | CSP Duplicada: Definida en `meta` tag y headers HTTP | Media | **MEDIA** | ZAP, HostedScan |
| **🟡 MEDIA** | CSP: Directiva `frame-ancestors` faltante | Media | **MEDIA** | ZAP, HostedScan |
| **🟡 MEDIA** | CSP: `img-src` demasiado amplio (`https:`) | Media | **BAJA-MEDIA** | ZAP, HostedScan |
| **🟡 MEDIA** | CORS: `Access-Control-Allow-Origin: *` en assets | Media | **MEDIA** | ZAP, HostedScan |
| **🟡 MEDIA** | HSTS: No aplicado consistentemente a todos los assets | Baja | **MEDIA** | ZAP, HostedScan |
| **🟡 MEDIA** | X-Frame-Options definido en `meta` tag (no compatible) | Media | **BAJA** | ZAP, HostedScan |
| **🟢 BAJA** | Script de terceros desde `cdnjs.cloudflare.com` | Baja | **BAJA** | ZAP, HostedScan |
| **⚪ INFORMATIVO** | Puertos 80 y 443 abiertos | Baja | **N/A** | Nmap |

---

## 3. PLAN DE REMEDIACIÓN DETALLADO (POR PRIORIDAD)

### 🔴 A. HALLAZGO: CSP Inseguro - `script-src 'unsafe-inline'` y `'unsafe-eval'`

#### **Riesgo Real:**
En una Single Page Application (SPA) como React, `unsafe-inline` y `unsafe-eval` representan un **riesgo crítico de Cross-Site Scripting (XSS)**. `unsafe-inline` permite la ejecución de scripts inline (como `<script>alert('XSS')</script>`) y manejadores de eventos inline (como `onclick="maliciousCode()"`). `unsafe-eval` permite el uso de `eval()`, `new Function()`, y `setTimeout/setInterval` con strings, lo que puede ser explotado si un atacante logra inyectar código malicioso (por ejemplo, a través de input no sanitizado que se renderiza en el DOM). Aunque React escapa automáticamente el contenido en JSX, vulnerabilidades en librerías de terceros, configuraciones incorrectas de Supabase RLS, o el uso de `dangerouslySetInnerHTML` podrían permitir la ejecución de código malicioso.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Paso 1: Eliminar el script inline del `index.html`**

**Problema identificado:** El archivo `index.html` contiene un script inline (líneas 127-135) que previene el flash del tema oscuro. Este script requiere `unsafe-inline`.

**Solución:** Mover este script a un archivo externo o usar un nonce.

**Acción 1.1:** Crear un archivo `src/utils/theme-init.ts`:

```typescript
// src/utils/theme-init.ts
export function initializeTheme(): void {
  const theme = localStorage.getItem('inventory-theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

// Ejecutar inmediatamente
initializeTheme();
```

**Acción 1.2:** Modificar `src/main.tsx` para importar y ejecutar antes de renderizar:

```typescript
// src/main.tsx (al inicio, antes de ReactDOM.createRoot)
import { initializeTheme } from './utils/theme-init';
initializeTheme();

// ... resto del código
```

**Acción 1.3:** Eliminar el script inline del `index.html` (líneas 127-135).

##### **Paso 2: Configurar CSP con nonces para Vite (Opcional pero Recomendado)**

**Nota:** Vite genera scripts con hashes automáticos, pero para scripts inline personalizados, usar nonces es la mejor práctica.

**Alternativa más simple para Vite:** Vite ya maneja los scripts del bundle con hashes automáticos. Solo necesitamos eliminar `unsafe-inline` y `unsafe-eval` del CSP. Los scripts de Vite funcionarán automáticamente.

##### **Paso 3: Verificar dependencias que requieren `unsafe-eval`**

**Análisis realizado:** No se encontraron usos de `eval()` o `new Function()` en el código. El único `setTimeout` encontrado (en `Donations.tsx:217`) usa una función, no un string, por lo que es seguro.

**Dependencias a verificar:**
- React Query: ✅ No requiere `unsafe-eval`
- Recharts: ✅ No requiere `unsafe-eval`
- Supabase Client: ✅ No requiere `unsafe-eval`
- xlsx (desde CDN): ⚠️ Puede requerir `unsafe-eval` en algunos casos

**Recomendación:** Auto-hospedar `xlsx` localmente y verificar si requiere `unsafe-eval`. Si es así, considerar una alternativa o habilitar `unsafe-eval` solo para ese script específico usando un nonce.

##### **Paso 4: Actualizar `vercel.json` con CSP estricto**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'strict-dynamic' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://vercel.com https://*.vercel.app; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content"
        }
        // ... otros headers
      ]
    }
  ]
}
```

**Explicación:**
- `'strict-dynamic'`: Permite que los scripts cargados por scripts confiables (`'self'`) carguen scripts adicionales, lo que funciona bien con Vite.
- Eliminamos `'unsafe-inline'` y `'unsafe-eval'` de `script-src`.
- Mantenemos `'unsafe-inline'` en `style-src` temporalmente (ver siguiente hallazgo).

---

### 🔴 B. HALLAZGO: CSP Inseguro - `style-src 'unsafe-inline'`

#### **Riesgo Real:**
`unsafe-inline` en `style-src` permite la inyección de estilos inline, lo que puede llevar a **ataques de exfiltración de datos mediante CSS** (CSS-based data exfiltration) o **clickjacking mejorado**. Aunque el riesgo es menor que en `script-src`, sigue siendo una vulnerabilidad que debe ser corregida.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Paso 1: Mover estilos inline a archivo CSS**

**Problema identificado:** El archivo `index.html` contiene estilos inline (líneas 27-124) con variables CSS para temas.

**Solución:** Mover estos estilos a `src/index.css`.

**Acción 1.1:** Agregar las variables CSS al inicio de `src/index.css`:

```css
/* Variables CSS para temas (movidas desde index.html) */
:root {
  --background: 210 20% 98%;
  --foreground: 215 25% 27%;
  /* ... todas las variables existentes ... */
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  /* ... todas las variables dark existentes ... */
}

html {
  scroll-behavior: smooth;
}
```

**Acción 1.2:** Eliminar el bloque `<style>` del `index.html` (líneas 27-124).

##### **Paso 2: Verificar estilos inline en componentes React**

**Análisis:** Los componentes React de esta aplicación usan Tailwind CSS y clases, no estilos inline peligrosos. Los únicos estilos inline que podrían existir serían de librerías de terceros, que generalmente son seguros si provienen de fuentes confiables.

##### **Paso 3: Actualizar CSP para eliminar `'unsafe-inline'` de `style-src`**

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'strict-dynamic' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://vercel.com https://*.vercel.app; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content"
}
```

**Nota:** Si después de eliminar `'unsafe-inline'` encuentras errores de CSP relacionados con estilos, verifica si alguna librería (como Recharts o componentes de UI) está inyectando estilos inline. En ese caso, puedes usar nonces para esos estilos específicos, pero es raro que sea necesario.

---

### 🟡 C. HALLAZGO: CSP Duplicada - Definida en `meta` tag y headers HTTP

#### **Riesgo Real:**
Definir la CSP tanto en un `meta` tag como en headers HTTP puede causar **conflicto de políticas**, donde el navegador puede aplicar una política más permisiva o generar errores de consola. Además, las `meta` tags tienen limitaciones (no soportan todas las directivas, como `frame-ancestors`). La forma correcta es definirla solo en headers HTTP.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Paso 1: Eliminar todas las `meta` tags de seguridad del `index.html`**

**Archivo:** `index.html`

**Acción:** Eliminar las siguientes líneas:
- Línea 10: `<meta http-equiv="X-Content-Type-Options" content="nosniff" />`
- Línea 11: `<meta http-equiv="X-Frame-Options" content="DENY" />`
- Línea 12: `<meta http-equiv="X-XSS-Protection" content="1; mode=block" />`
- Línea 13: `<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />`
- Línea 14: `<meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />`
- Líneas 16-18: Todo el bloque de CSP en `meta` tag

**Resultado:** El `index.html` solo debe contener `meta` tags estándar (charset, viewport, title, etc.). Todos los headers de seguridad deben venir de `vercel.json`.

---

### 🟡 D. HALLAZGO: CSP - Directiva `frame-ancestors` faltante

#### **Riesgo Real:**
La directiva `frame-ancestors` controla qué sitios pueden incrustar tu aplicación en un `<iframe>`. Si no está definida, **cualquier sitio puede incrustar tu aplicación**, lo que permite ataques de **clickjacking**. Aunque ya tienes `X-Frame-Options: DENY` (que hace lo mismo), `frame-ancestors` es más moderno y flexible, y debe estar en la CSP.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Actualizar `vercel.json`:**

La CSP actual en `vercel.json` ya incluye `frame-src 'none'`, pero falta `frame-ancestors`. Agregar:

```json
{
  "key": "Content-Security-Policy",
  "value": "... frame-src 'none'; frame-ancestors 'none'; ..."
}
```

**Nota:** `frame-ancestors 'none'` previene que tu sitio sea incrustado en cualquier iframe, lo cual es la configuración más segura para una aplicación de gestión interna.

---

### 🟡 E. HALLAZGO: CSP - `img-src` demasiado amplio (`https:`)

#### **Riesgo Real:**
Permitir `https:` en `img-src` permite cargar imágenes desde **cualquier dominio HTTPS**, lo que puede ser explotado para **exfiltración de datos** (enviando datos sensibles como parámetros de URL a servidores controlados por atacantes) o **ataques de phishing** (cargando imágenes maliciosas que parecen legítimas).

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Actualizar `vercel.json` con dominios específicos:**

**Análisis de dominios necesarios:**
- `'self'`: Imágenes locales
- `data:`: Imágenes en base64 (comunes en React)
- `https://*.supabase.co`: Para imágenes almacenadas en Supabase Storage (si las usas)
- `https://vercel.com` y `https://*.vercel.app`: Para assets de Vercel (si los usas)

**CSP actualizada:**
```json
{
  "key": "Content-Security-Policy",
  "value": "... img-src 'self' data: https://*.supabase.co https://vercel.com https://*.vercel.app; ..."
}
```

**Si usas Google Fonts u otros CDNs para imágenes, agrégalos explícitamente:**
```json
"img-src 'self' data: https://*.supabase.co https://vercel.com https://*.vercel.app https://fonts.gstatic.com;"
```

---

### 🟡 F. HALLAZGO: CORS - `Access-Control-Allow-Origin: *` en assets

#### **Riesgo Real:**
Servir assets estáticos (CSS, JS) con `Access-Control-Allow-Origin: *` permite que **cualquier sitio web** realice solicitudes a tus recursos. Aunque los navegadores modernos bloquean solicitudes autenticadas desde otros orígenes, esto sigue siendo una **mala práctica de seguridad** y puede ser explotado en combinación con otras vulnerabilidades.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Problema:**
Vercel puede estar enviando `Access-Control-Allow-Origin: *` por defecto para assets estáticos. Esto no es necesario para una aplicación web estándar que no expone una API pública.

##### **Solución 1: Configurar CORS restrictivo en `vercel.json`**

Agregar headers para assets estáticos que **no** incluyan CORS (o que lo restrinjan a `'self'`):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        // ... headers principales ...
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "null"
        }
      ]
    },
    {
      "source": "/(.*\\.(js|css|woff2|woff|ttf|eot))",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "null"
        }
      ]
    }
  ]
}
```

**Nota:** `Access-Control-Allow-Origin: null` en realidad no envía la cabecera, pero si Vercel la está agregando automáticamente, es posible que necesites contactar al soporte de Vercel o usar una función de Edge para eliminarla.

##### **Solución 2: Verificar configuración de Supabase**

**Importante:** Si estás usando Supabase Storage para servir assets, configura CORS en el dashboard de Supabase:

1. Ve a **Storage** → **Policies**
2. Configura las políticas de CORS para permitir solo tu dominio:
   - Origen permitido: `https://gestion-inventario-la-gran-familia.vercel.app`
   - Métodos: `GET, HEAD`
   - Headers: `Authorization, Content-Type`

##### **Solución 3: Si necesitas CORS para una API pública (futuro)**

Si en el futuro necesitas exponer una API pública, crea una ruta específica (ej: `/api/public/(.*)`) y configura CORS solo para esa ruta:

```json
{
  "source": "/api/public/(.*)",
  "headers": [
    {
      "key": "Access-Control-Allow-Origin",
      "value": "https://dominio-permitido.com"
    },
    {
      "key": "Access-Control-Allow-Methods",
      "value": "GET, POST, OPTIONS"
    },
    {
      "key": "Access-Control-Allow-Headers",
      "value": "Authorization, Content-Type"
    }
  ]
}
```

---

### 🟡 G. HALLAZGO: HSTS - No aplicado consistentemente a todos los assets

#### **Riesgo Real:**
El header `Strict-Transport-Security` (HSTS) fuerza a los navegadores a usar **solo HTTPS** para todas las solicitudes futuras a tu dominio. Si no se aplica consistentemente a todos los assets (CSS, JS, imágenes), un atacante podría interceptar solicitudes HTTP (aunque sean redirigidas a HTTPS) en un ataque de **SSL Stripping** o **Man-in-the-Middle (MITM)**.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Verificación:**
Tu `vercel.json` ya incluye HSTS en la sección `"source": "/(.*)"`, lo que debería aplicarlo a todas las rutas. Sin embargo, es posible que algunos assets estáticos no lo estén recibiendo.

##### **Solución: Asegurar HSTS en todas las rutas**

Verificar que HSTS esté aplicado a **todas** las rutas, incluyendo assets estáticos:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
        // ... otros headers ...
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*\\.(js|css|woff2|woff|ttf|eot|png|jpg|jpeg|gif|svg|ico))",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

**Nota:** El patrón `"source": "/(.*)"` debería capturar todo, pero si hay problemas, agregar reglas específicas para assets garantiza que HSTS se aplique.

##### **Verificación Post-Despliegue:**
Después de desplegar, verificar con herramientas como:
- [SecurityHeaders.com](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)

---

### 🟡 H. HALLAZGO: X-Frame-Options definido en `meta` tag (no compatible)

#### **Riesgo Real:**
Las `meta` tags con `http-equiv="X-Frame-Options"` **no son compatibles con la especificación RFC 7034**. Los navegadores modernos pueden ignorarlas. Aunque ya tienes `X-Frame-Options: DENY` en `vercel.json` (que es correcto), tenerlo también en `meta` tag es redundante y puede causar confusión.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Eliminar `meta` tag de `index.html`:**

**Archivo:** `index.html`

**Acción:** Eliminar la línea 11:
```html
<meta http-equiv="X-Frame-Options" content="DENY" />
```

**Justificación:** Ya está correctamente configurado en `vercel.json` como header HTTP, que es la forma estándar y compatible.

---

### 🟢 I. HALLAZGO: Script de terceros desde `cdnjs.cloudflare.com`

#### **Riesgo Real:**
Cargar scripts desde CDNs de terceros introduce una **dependencia de seguridad externa**. Si el CDN es comprometido o el script es modificado maliciosamente, tu aplicación podría ejecutar código malicioso. Aunque `cdnjs.cloudflare.com` es una fuente confiable, auto-hospedar el script elimina este riesgo y simplifica tu CSP.

#### **Instrucciones de Remediación (Específicas del Stack):**

##### **Paso 1: Descargar y auto-hospedar `xlsx.full.min.js`**

**Acción 1.1:** Descargar el archivo:
```bash
curl -o public/lib/xlsx.full.min.js https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
```

**Acción 1.2:** Crear el directorio si no existe:
```bash
mkdir -p public/lib
```

##### **Paso 2: Actualizar `index.html`**

**Antes:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>
```

**Después:**
```html
<script src="./lib/xlsx.full.min.js" defer></script>
```

##### **Paso 3: Actualizar CSP en `vercel.json`**

Eliminar `https://cdnjs.cloudflare.com` de `script-src`:

```json
{
  "key": "Content-Security-Policy",
  "value": "... script-src 'self' 'strict-dynamic'; ..."
}
```

##### **Paso 4: Verificar integridad (Opcional pero Recomendado)**

Agregar un hash de integridad al script para prevenir modificaciones:

```bash
# Calcular hash SHA-384
openssl dgst -sha384 -binary public/lib/xlsx.full.min.js | openssl base64 -A
```

Luego en `index.html`:
```html
<script src="./lib/xlsx.full.min.js" defer integrity="sha384-<hash-calculado>" crossorigin="anonymous"></script>
```

**Nota:** Si usas Subresource Integrity (SRI), necesitas agregar `'sha384-<hash>'` a `script-src` en la CSP.

---

### ⚪ J. HALLAZGO: Puertos 80 y 443 abiertos (Informativo)

#### **Riesgo Real:**
**Ninguno**. Es normal y esperado que un servidor web tenga los puertos 80 (HTTP) y 443 (HTTPS) abiertos.

#### **Verificación Recomendada:**
Asegurar que el puerto 80 redirija permanentemente (301) al puerto 443 (HTTPS). Vercel hace esto automáticamente, pero puedes verificarlo accediendo a `http://gestion-inventario-la-gran-familia.vercel.app` y confirmando que redirige a `https://`.

---

## 4. CONFIGURACIÓN FINAL DE `vercel.json` (COMPLETA)

Aquí está la configuración completa de `vercel.json` con todas las correcciones aplicadas:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'strict-dynamic'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://vercel.com https://*.vercel.app; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate, proxy-revalidate"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Correcciones Críticas (Alta Prioridad)
- [ ] Eliminar script inline del `index.html` (tema oscuro)
- [ ] Crear `src/utils/theme-init.ts` y actualizar `src/main.tsx`
- [ ] Mover estilos inline de `index.html` a `src/index.css`
- [ ] Eliminar todas las `meta` tags de seguridad del `index.html`
- [ ] Actualizar `vercel.json` con CSP estricto (sin `unsafe-inline` ni `unsafe-eval`)
- [ ] Agregar `frame-ancestors 'none'` a la CSP
- [ ] Restringir `img-src` a dominios específicos

### Fase 2: Correcciones Importantes (Media Prioridad)
- [ ] Auto-hospedar `xlsx.full.min.js` y actualizar `index.html`
- [ ] Verificar y configurar CORS en Supabase (si aplica)
- [ ] Asegurar HSTS en todas las rutas de `vercel.json`
- [ ] Probar la aplicación después de los cambios

### Fase 3: Verificación Post-Despliegue
- [ ] Verificar con [SecurityHeaders.com](https://securityheaders.com)
- [ ] Verificar con [Mozilla Observatory](https://observatory.mozilla.org)
- [ ] Verificar que no haya errores de CSP en la consola del navegador
- [ ] Verificar que el tema oscuro funciona correctamente
- [ ] Verificar que la exportación a Excel funciona con el script local

---

## 6. NOTAS ADICIONALES

### Sobre `'strict-dynamic'` en CSP
`'strict-dynamic'` permite que los scripts cargados por scripts confiables (`'self'`) carguen scripts adicionales. Esto es compatible con Vite, que genera scripts con hashes automáticos. Los scripts de Vite funcionarán sin necesidad de `unsafe-inline`.

### Sobre Subresource Integrity (SRI)
Si decides usar SRI para el script `xlsx.full.min.js`, recuerda que necesitas agregar el hash a la CSP. Esto agrega una capa extra de seguridad, pero también complejidad de mantenimiento (cada vez que actualices el script, necesitarás recalcular el hash).

### Sobre CORS en Vercel
Vercel puede estar enviando `Access-Control-Allow-Origin: *` automáticamente para algunos assets. Si después de implementar las correcciones sigues viendo esta cabecera, es posible que necesites contactar al soporte de Vercel o usar una función de Edge para eliminarla.

### Sobre Cache-Control
La configuración actual de `Cache-Control` es adecuada:
- `public, max-age=0, must-revalidate` para páginas HTML (fuerza revalidación)
- `public, max-age=31536000, immutable` para assets estáticos (caché largo)

Para contenido sensible (como páginas de login o datos de usuario), considera usar `no-cache, no-store, must-revalidate`.

---

## 7. RECURSOS Y HERRAMIENTAS

### Herramientas de Verificación
- [SecurityHeaders.com](https://securityheaders.com) - Verifica headers de seguridad
- [Mozilla Observatory](https://observatory.mozilla.org) - Análisis de seguridad
- [CSP Evaluator](https://csp-evaluator.withgoogle.com) - Evalúa políticas CSP
- [HSTS Preload](https://hstspreload.org) - Preload HSTS para tu dominio

### Documentación
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vercel: Headers Configuration](https://vercel.com/docs/concepts/projects/project-configuration#headers)
- [Supabase: Storage CORS](https://supabase.com/docs/guides/storage/serving/downloads#cross-origin-resource-sharing-cors)

---

**Fin del Informe de Auditoría de Seguridad Consolidado**

