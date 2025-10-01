// src/controllers/movementController.js
import { supabase } from "../db/supabaseClient.js";

/**
 * GET /api/movements
 * Devuelve un listado unificado de:
 *  - movimientosinventario (entrada/salida/ajuste)
 *  - movimientosalmacenes (transferencias)
 * Cada registro trae nombres de producto y almacenes (cuando aplican).
 */
export const getMovements = async (req, res) => {
  try {
    // 1) Obtener movimientos inventario
    const { data: invData, error: invError } = await supabase
      .from("movimientosinventario")
      .select("*")
      .order("fecha", { ascending: false });
    if (invError) throw invError;

    // 2) Obtener movimientos de almacenes (traspasos)
    const { data: transData, error: transError } = await supabase
      .from("movimientosalmacenes")
      .select("*")
      .order("fecha", { ascending: false });
    if (transError) throw transError;

    // 3) Obtener productos y almacenes para mapear nombres
    const { data: products, error: productsError } = await supabase
      .from("productos")
      .select("producto_id, nombre");
    if (productsError) throw productsError;

    const { data: almacenes, error: almacenesError } = await supabase
      .from("almacenes")
      .select("almacen_id, nombre");
    if (almacenesError) throw almacenesError;

    const prodMap = new Map(
      (products || []).map((p) => [p.producto_id, p.nombre])
    );
    const almacMap = new Map(
      (almacenes || []).map((a) => [a.almacen_id, a.nombre])
    );

    // 4) Normalizar movimientos inventario
    const invNormalized = (invData || []).map((m) => ({
      id: m.movimiento_inventario_id,
      source: "inventario",
      type: m.tipo_movimiento, // 'entrada' | 'salida' | 'ajuste'
      productId: m.producto_id,
      productName: prodMap.get(m.producto_id) || null,
      quantity: Number(m.cantidad),
      date: m.fecha,
      reason: m.observaciones || m.descripcion_producto || "",
      fromWarehouseId: null,
      fromWarehouseName: null,
      toWarehouseId: null,
      toWarehouseName: null,
      userId: m.usuario_id,
      raw: m,
    }));

    // 5) Normalizar traspasos
    const transNormalized = (transData || []).map((t) => ({
      id: t.movimiento_almacen_id,
      source: "almacenes",
      type: "transfer", // estandarizamos a 'transfer'
      productId: t.producto_id,
      productName: prodMap.get(t.producto_id) || null,
      quantity: Number(t.cantidad),
      date: t.fecha,
      reason: t.observaciones || "",
      fromWarehouseId: t.almacen_origen,
      fromWarehouseName: almacMap.get(t.almacen_origen) || null,
      toWarehouseId: t.almacen_destino,
      toWarehouseName: almacMap.get(t.almacen_destino) || null,
      userId: t.usuario_id,
      raw: t,
    }));

    // 6) Unir y ordenar por fecha descendente
    const combined = [...invNormalized, ...transNormalized].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json(combined);
  } catch (error) {
    console.error("getMovements error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error al obtener movimientos" });
  }
};

/**
 * POST /api/movements/transfer
 * Hace el traspaso entre almacenes:
 *  - inserta en movimientosalmacenes
 *  - registra una salida en movimientosinventario
 *  - registra una entrada en movimientosinventario
 *
 * Body: { productId, fromWarehouse, toWarehouse, quantity, userId, reason }
 */
export const transferStock = async (req, res) => {
  const { productId, fromWarehouse, toWarehouse, quantity, userId, reason } =
    req.body;

  if (
    !productId ||
    !fromWarehouse ||
    !toWarehouse ||
    !quantity ||
    Number(quantity) <= 0
  ) {
    return res.status(400).json({ error: "Parámetros inválidos" });
  }

  try {
    // 1) Insertar en movimientosalmacenes
    const { data: mov, error: movError } = await supabase
      .from("movimientosalmacenes")
      .insert([
        {
          producto_id: productId,
          almacen_origen: fromWarehouse,
          almacen_destino: toWarehouse,
          cantidad: quantity,
          usuario_id: userId || null,
          observaciones: reason || "Traspaso entre almacenes",
          tipo_movimiento_interno: "traspaso",
        },
      ])
      .select()
      .single();
    if (movError) throw movError;

    // 2) Registrar salida en movimientosinventario
    const { error: outError } = await supabase
      .from("movimientosinventario")
      .insert([
        {
          producto_id: productId,
          tipo_movimiento: "salida",
          cantidad: quantity,
          usuario_id: userId || null,
          referencia_tipo: "movimientosalmacenes",
          referencia_id: mov.movimiento_almacen_id,
          observaciones: `Salida por traspaso desde almacén ${fromWarehouse}`,
        },
      ]);
    if (outError) throw outError;

    // 3) Registrar entrada en movimientosinventario
    const { error: inError } = await supabase
      .from("movimientosinventario")
      .insert([
        {
          producto_id: productId,
          tipo_movimiento: "entrada",
          cantidad: quantity,
          usuario_id: userId || null,
          referencia_tipo: "movimientosalmacenes",
          referencia_id: mov.movimiento_almacen_id,
          observaciones: `Entrada por traspaso a almacén ${toWarehouse}`,
        },
      ]);
    if (inError) throw inError;

    res
      .status(201)
      .json({
        message: "Transferencia realizada con éxito",
        transferId: mov.movimiento_almacen_id,
      });
  } catch (error) {
    console.error("transferStock error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error al realizar transferencia" });
  }
};
