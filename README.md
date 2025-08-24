# Sistema de Gestión de Inventario para "La Gran Familia"

Este documento describe el problema, la justificación y la propuesta de solución para un sistema de gestión de inventario simplificado y gratuito para la ONG "La Gran Familia".

---

## Contexto del Proyecto

### 1. La Necesidad (El porqué del proyecto)
La necesidad principal es la **falta de control y la ineficiencia en la gestión del almacén**. El problema de raíz es que los procesos actuales están desconectados y son manuales:
* Las entradas de donativos se registran en Excel.
* Las salidas de productos del almacén se apuntan a mano.

Esta falta de un sistema unificado provoca que sea muy difícil saber con exactitud qué tienen, cuánto les queda y cómo se están utilizando los recursos. Esto es crítico para una organización que debe garantizar la alimentación e higiene de los niños a su cargo.

### 2. Lo que Justifica el Proyecto
El proyecto se justifica por el deseo de **profesionalizar y estandarizar la operación del almacén**. La gestión actual, al ser manual y desorganizada, no es sostenible ni fiable. La justificación se basa en alcanzar objetivos concretos que resolverán los problemas actuales:

* **Centralizar la Información:** Crear una única base de datos para saber exactamente qué hay en el inventario.
* **Mejorar la Organización:** Clasificar todos los productos por categorías (alimentación, limpieza, ropa, etc.) para facilitar la búsqueda y el control.
* **Aumentar la Trazabilidad:** Implementar un sistema de validación, como una firma digital, para tener un registro claro de quién retira los materiales y cuándo.
* **Control Financiero:** Añadir una función para monitorear los gastos de la organización.

### 3. La Razón del Proyecto (El Objetivo Final)
La razón fundamental del proyecto es implementar una solución que sea **sencilla, intuitiva y gratuita**. El objetivo no es simplemente digitalizar, sino hacerlo de una manera que se adapte a las necesidades y limitaciones de la ONG. La filosofía es clara: **"que el sistema trabaje para ellos, no ellos para el sistema"**.

En resumen, no quieren un sistema complejo y caro como un ERP. Buscan una herramienta inteligente y de bajo mantenimiento que les dé el control que necesitan sobre sus recursos para que puedan enfocarse en su misión principal: cuidar a los niños.

---

## Propuesta de Solución Simplificada y Gratuita

Se propone un ecosistema basado en herramientas de Google, que son gratuitas, colaborativas y muy fáciles de usar para personas con cualquier nivel de habilidad técnica.

Este sistema se compone de 3 partes: **Formularios** (para la entrada), **Hojas de Cálculo** (como base de datos) y un **Panel de Control** (para la visualización).

### Componentes de la Solución

* **Entrada de Datos: Google Forms**
    * **¿Por qué?** Es la herramienta de creación de formularios más sencilla que existe. Es gratis, intuitiva y funciona perfectamente en celulares, tabletas o computadoras.

* **Base de Datos Centralizada: Google Sheets**
    * **¿Por qué?** El personal ya está familiarizado con Excel. Google Sheets funciona de manera muy similar, pero en la nube, permitiendo el acceso desde cualquier lugar y evitando problemas con versiones de archivos. Cada formulario depositará la información aquí de forma automática y ordenada.

* **Visualización e Informes: Google Looker Studio**
    * **¿Por qué?** Es una herramienta gratuita para crear paneles de control interactivos y fáciles de entender. Se conecta directamente a Google Sheets y transforma los datos en gráficos y tablas claras. El personal podrá consultar el inventario en tiempo real sin tener que tocar las hojas de cálculo.

### Flujo de Trabajo Propuesto

1.  **Digitalizar las Entradas (Donativos) 📥**
    * **Acción:** Crear un Google Form llamado "Registro de Donativo".
    * **Funcionamiento:** Cada vez que alguien llena este formulario, una nueva fila se añade automáticamente a la hoja de cálculo, eliminando la transcripción manual.

2.  **Digitalizar las Salidas de Almacén 📤**
    * **Acción:** Crear un segundo Google Form llamado "Registro de Salida de Almacén".
    * **Funcionamiento:** Cada envío del formulario añade una fila a una hoja de cálculo de salidas, registrando quién retira material y cuándo.

3.  **Crear el Panel de Control del Inventario 📊**
    * **Acción:** Usar Google Looker Studio para crear un panel visual conectado a las hojas de cálculo.
    * **¿Qué mostrará el panel?** Inventario en Tiempo Real, Alertas de Stock Bajo, Gráficos de Donativos e Historial de Salidas.

### Ventajas de esta Propuesta

* ✅ **Costo Cero:** Todas las herramientas son 100% gratuitas.
* 🧠 **Extremadamente Sencillo:** Llenar un formulario es mucho más fácil que navegar una hoja de Excel compleja.
* ⚙️ **Bajo Mantenimiento:** Una vez configurado, el sistema funciona solo, sin necesidad de código.
* 🌐 **Accesible y Centralizado:** La información está siempre actualizada y disponible desde cualquier dispositivo con internet.
* 🔒 **Seguro:** El personal interactúa con los formularios y el panel (de solo lectura), protegiendo la integridad de la base de datos.

---

## Acerca de La Gran Familia

### Historia
[cite_start]La Gran Familia nació en la década de los ochenta como un esfuerzo conjunto de empresarios, encabezados por Don Alberto Santos de Hoyos, y el gobierno de Nuevo León, para asegurar que no hubiera niños en situación de calle en el estado[cite: 1]. [cite_start]Hoy en día, la organización acoge a niños cuyas familias no les han ofrecido la protección que merecen, habiendo albergado a aproximadamente 2200 menores de edad a lo largo de su historia[cite: 1].

### Misión
[cite_start]Brindar a menores de edad privados de cuidados parentales, un acogimiento residencial inspirado por valores y habilidades familiares que encienda en ellos la esperanza y les prepare para un proyecto de vida en familia[cite: 1].

### Visión
[cite_start]A niñas, niños y adolescentes privados de cuidados parentales, se les incorpora en una familia que promueve su desarrollo integral como hombres y mujeres capaces de formar familias en armonía[cite: 1].
