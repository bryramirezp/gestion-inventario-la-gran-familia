Plan de implementación
1. Modificar API de donaciones (src/data/api/donation.api.ts)
Objetivo: incluir los lotes asociados a cada item de donación en la respuesta.
Cambios:
Ajustar getHistory para incluir stock_lots relacionados por donation_item_id en la query de Supabase.
Mapear los lotes en la transformación de datos.
Query sugerida:
donation_items(  *,  stock_lots:stock_lots!stock_lots_donation_item_id_fkey(*))
2. Actualizar tipos TypeScript (src/domain/types/donation.types.ts)
Cambios:
Agregar stock_lots?: StockLot[] a DonationItem.
Agregar item_id?: number a DonationItem si no está.
3. Modificar DonationItemsModal (src/presentation/pages/donations/Donations.tsx)
Objetivo: mostrar los lotes asociados a cada item y permitir eliminarlos.
Cambios:
Expandir cada item de donación para mostrar sus lotes.
Agregar columna "Lotes" con badges o botón para ver detalles.
Agregar columna "Acciones" con botón de eliminar lote (por lote).
Implementar confirmación antes de eliminar (diálogo o confirm).
Usar useApiMutation para eliminar lotes.
Invalidar/queries después de eliminar para refrescar datos.
UI sugerida:
Tabla expandible o sección por item.
Botón "Eliminar Lote" por lote con confirmación.
Indicador visual si no hay lotes asociados.
4. Verificar permisos RLS
Confirmar que las políticas permiten eliminar lotes (Admin y Operador con acceso al almacén).
El código existente ya maneja permisos.
5. Manejo de errores y validaciones
Cambios:
Validar que el usuario tiene permisos antes de mostrar acciones.
Mostrar mensajes de error si falla la eliminación.
Confirmar que el lote existe antes de eliminar.
Validar que el lote pertenece al almacén correcto.
6. Actualización de UI/UX
Mejoras:
Loading states al eliminar.
Mensajes de éxito/error con useAlerts.
Deshabilitar botones durante la operación.
Skeleton mientras cargan los lotes.
Flujo de usuario
Usuario abre la página de donaciones.
Usuario hace clic en "Ver Artículos" de una donación.
El modal muestra los items con sus lotes asociados.
Por cada lote, se muestra un botón "Eliminar".
Usuario hace clic en "Eliminar" → confirmación.
Si confirma → se elimina el lote → mensaje de éxito → refrescar datos.
Si el lote estaba asociado a un item de donación, donation_item_id queda en NULL (no se elimina la donación).
Archivos a modificar
src/data/api/donation.api.ts — incluir lotes en la query
src/domain/types/donation.types.ts — agregar tipos
src/presentation/pages/donations/Donations.tsx — modal con funcionalidad de eliminar
(Opcional) src/presentation/components/ui/ConfirmDialog.tsx — componente de confirmación reutilizable
Consideraciones adicionales
Auditoría: considerar registrar quién y cuándo eliminó un lote (si aplica).
Validaciones de negocio: verificar si el lote puede eliminarse (por ejemplo, si ya fue usado).
Performance: si hay muchos lotes, usar paginación o lazy loading.
Prioridad de implementación
Alta: Modificar API para incluir lotes
Alta: Actualizar tipos TypeScript
Alta: Modificar modal para mostrar lotes
Media: Agregar funcionalidad de eliminar
Media: Agregar confirmaciones y validaciones
Baja: Mejoras de UI/UX (loading states, etc.)