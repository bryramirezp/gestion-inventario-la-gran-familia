import fs from "fs";
import XLSX from "xlsx";
import { parse } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "../db/supabaseClient.js";

// --------------------- HELPERS ---------------------

const normalizeHeader = (header) => {
  if (!header) return "";
  return header
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
};

const parseNumber = (val) => {
  if (!val) return 0;
  const n = Number(val.toString().replace(/[^0-9.-]+/g, ""));
  return isNaN(n) ? 0 : n;
};

const parseDateSafe = (val) => {
  if (!val) return null;

  // Si viene como número (ejemplo 45647 en Excel)
  if (!isNaN(val)) {
    const utc_days = Math.floor(val - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split("T")[0]; // formato YYYY-MM-DD
  }

  const formats = ["dd MMM yyyy", "dd MMMM yyyy"];
  for (const fmt of formats) {
    try {
      const d = parse(val.toString(), fmt, new Date(), { locale: es });
      if (!isNaN(d)) return d.toISOString().split("T")[0];
    } catch {}
  }
  console.warn(`Fecha inválida, se asigna null: ${val}`);
  return null;
};

const processExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const allRows = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rowsRaw = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
    });
    if (!rowsRaw || rowsRaw.length === 0) return;

    const headerRowIndex = rowsRaw.findIndex((row) =>
      row.some(
        (cell) =>
          cell && cell.toString().toLowerCase().includes("nombre completo")
      )
    );
    if (headerRowIndex === -1) return;

    const headers = rowsRaw[headerRowIndex].map(normalizeHeader);
    const dataRows = rowsRaw.slice(headerRowIndex + 1);

    const rows = dataRows
      .map((r) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = r[i] ?? null));
        obj["anio"] = sheetName;
        return obj;
      })
      .filter(
        (r) => r.cantidad && (r.descripcion || r.producto || r.nombre_producto)
      );

    allRows.push(...rows);
  });

  return allRows;
};

// --------------------- MAIN FUNCTION ---------------------
// --------------------- MAIN FUNCTION ---------------------

export const uploadDonativos = async (req, res) => {
  const filePath = req.file.path;

  const donadorCache = new Map();
  const productoCache = new Map();
  const errors = [];
  let insertedDonativos = 0;

  const setCurrentUser = async (userId) => {
    await supabase.rpc("set_config", {
      key: "app.current_user_id",
      value: userId.toString(),
    });
  };

  try {
    const rows = processExcel(filePath);
    console.log(`Número de filas a procesar: ${rows.length}`);

    // -------- Precargar Donadores --------
    const { data: donadores, error: donadoresError } = await supabase
      .from("donadores")
      .select("*");

    if (donadoresError) {
      console.error("Error cargando donadores:", donadoresError);
    } else {
      donadores?.forEach((d) => {
        const key = d.nombre_completo?.trim().toLowerCase();
        if (key) donadorCache.set(key, d.donador_id);

        // También cachear por email si existe
        if (d.correo) {
          const emailKey = d.correo.trim().toLowerCase();
          donadorCache.set(emailKey, d.donador_id);
        }
      });
    }

    // -------- Precargar Productos --------
    const { data: productos, error: productosError } = await supabase
      .from("productos")
      .select("*");

    if (productosError) {
      console.error("Error cargando productos:", productosError);
    } else {
      productos?.forEach((p) => {
        const key = p.nombre?.trim().toLowerCase();
        if (key) productoCache.set(key, p.producto_id);
      });
    }

    await setCurrentUser(req.user.usuario_id);

    let currentDonativoId = null;
    let currentFecha = null;
    let acumuladoDetalles = 0;
    let detallesBatch = [];

    for (const [index, row] of rows.entries()) {
      try {
        const cantidad = parseNumber(row["cantidad"]);
        const descripcionProducto = (
          row["descripcion"] ||
          row["producto"] ||
          row["nombre_producto"]
        )?.trim();

        if (!cantidad || !descripcionProducto) {
          console.log(`Fila ${index + 1} saltada: sin cantidad o descripción`);
          continue;
        }

        const fechaFila = row["fecha"]
          ? parseDateSafe(row["fecha"])
          : currentFecha || new Date().toISOString().split("T")[0];

        // -------- Donador --------
        const email = row["correo"]?.trim();
        const nombre = row["nombre_completo"]?.trim() || "Sin nombre";

        // Limpiar nombre (quitar apóstrofes problemáticos)
        const nombreLimpio = nombre.replace(/['"]/g, "").trim();

        const keyDonador = email?.toLowerCase() || nombreLimpio.toLowerCase();
        let donadorId = donadorCache.get(keyDonador);

        if (!donadorId) {
          // Buscar donador existente de manera más robusta
          let query = supabase.from("donadores").select("*");

          if (email) {
            query = query.eq("correo", email);
          } else {
            query = query.eq("nombre_completo", nombreLimpio);
          }

          const { data: existing, error: searchError } = await query
            .limit(1)
            .single();

          if (searchError) {
            console.log(`Búsqueda de donador falló:`, searchError);
          }

          if (existing) {
            donadorId = existing.donador_id;
            donadorCache.set(keyDonador, donadorId);
            console.log(
              `Donador encontrado: ${nombreLimpio} (ID: ${donadorId})`
            );
          } else {
            // Crear nuevo donador
            const donadorObj = {
              nombre_completo: nombreLimpio,
              telefono: row["celular__telefono"]
                ? String(row["celular__telefono"])
                : null,
              correo: email || null,
              fecha_nacimiento: row["dia_y_ano_de_nacimiento"]
                ? parseDateSafe(row["dia_y_ano_de_nacimiento"])
                : null,
              direccion: row["direccion"] || null,
              tipo_donador_id: 1, // Default = Individual
              activo: true,
            };

            console.log(`Creando nuevo donador:`, donadorObj);

            const { data: newDonador, error: donadorErr } = await supabase
              .from("donadores")
              .insert([donadorObj])
              .select()
              .single();

            if (donadorErr) {
              console.error("Error creando donador:", donadorErr);
              throw new Error(`No se creó el donador: ${donadorErr.message}`);
            }

            if (!newDonador) {
              throw new Error("No se creó el donador - respuesta vacía");
            }

            donadorId = newDonador.donador_id;
            donadorCache.set(keyDonador, donadorId);
            console.log(
              `Nuevo donador creado: ${nombreLimpio} (ID: ${donadorId})`
            );
          }
        }

        // -------- Donativo --------
        if (
          !currentDonativoId ||
          currentFecha?.getTime?.() !== new Date(fechaFila).getTime()
        ) {
          if (currentDonativoId && acumuladoDetalles > 0) {
            await supabase
              .from("donativos")
              .update({
                total: acumuladoDetalles,
                total_con_descuento: acumuladoDetalles,
              })
              .eq("donativo_id", currentDonativoId);
          }

          const donativoObj = {
            donador_id: donadorId,
            fecha: fechaFila,
            fecha_recepcion: fechaFila,
            usuario_id: req.user.usuario_id,
            total: 0,
            total_con_descuento: 0,
            recibido_por: row["nombre_del_que_recibio"] || "",
            observaciones: row["descripcion"] || "",
          };

          const { data: newDonativo, error: donativoError } = await supabase
            .from("donativos")
            .insert([donativoObj])
            .select()
            .single();

          if (donativoError) {
            console.error("Error creando donativo:", donativoError);
            throw new Error(`No se creó el donativo: ${donativoError.message}`);
          }

          if (!newDonativo) {
            throw new Error("No se creó el donativo - respuesta vacía");
          }

          currentDonativoId = newDonativo.donativo_id;
          currentFecha = new Date(fechaFila);
          acumuladoDetalles = 0;
          insertedDonativos++;
          console.log(`Nuevo donativo creado: ID ${currentDonativoId}`);
        }

        // -------- Producto --------
        const precioUnitario = parseNumber(row["precio_unitario"]);
        const precioTotalFila =
          parseNumber(row["precio_total"]) || cantidad * precioUnitario;
        const productoKey = descripcionProducto.toLowerCase();
        let productoId = productoCache.get(productoKey);

        if (!productoId) {
          const { data: existingProd, error: prodError } = await supabase
            .from("productos")
            .select("*")
            .eq("nombre", descripcionProducto)
            .limit(1)
            .single();

          if (prodError) {
            console.log(`Búsqueda de producto falló:`, prodError);
          }

          if (existingProd) {
            productoId = existingProd.producto_id;
            productoCache.set(productoKey, productoId);
          } else {
            const productoObj = {
              nombre: descripcionProducto,
              descripcion: descripcionProducto,
              categoria_producto_id: null,
              unidad_medida_id: 1,
              stock: 0,
              precio_referencia: precioUnitario,
              activo: true,
            };

            const { data: newProducto, error: productoError } = await supabase
              .from("productos")
              .insert([productoObj])
              .select()
              .single();

            if (productoError) {
              console.error("Error creando producto:", productoError);
              throw new Error(
                `No se creó el producto: ${productoError.message}`
              );
            }

            if (!newProducto) {
              throw new Error("No se creó el producto - respuesta vacía");
            }

            productoId = newProducto.producto_id;
            productoCache.set(productoKey, productoId);
          }
        }

        // -------- Detalle Donativo --------
        const detalleObj = {
          donativo_id: currentDonativoId,
          producto_id: productoId,
          descripcion_producto: descripcionProducto,
          cantidad,
          unidad_medida_id: 1,
          precio_unitario: precioUnitario,
          precio_total: precioTotalFila,
          precio_factura: precioUnitario,
        };

        detallesBatch.push(detalleObj);
        acumuladoDetalles += precioTotalFila;

        if (detallesBatch.length >= 50) {
          console.log(`Insertando lote de ${detallesBatch.length} detalles`);
          for (const detalle of detallesBatch) {
            try {
              const { error: detalleError } = await supabase
                .from("detallesdonativos")
                .insert([detalle]);

              if (detalleError) {
                errors.push({ detalle, error: detalleError.message });
                console.error("Error insertando detalle:", detalleError);
              }
            } catch (err) {
              errors.push({ detalle, error: err.message });
              console.error("Error insertando detalle:", err);
            }
          }
          detallesBatch = [];
        }

        console.log(
          `Fila ${
            index + 1
          } procesada correctamente: ${nombreLimpio} - ${descripcionProducto}`
        );
      } catch (rowErr) {
        console.error(`Error en fila ${index + 1}:`, rowErr);
        errors.push({
          fila: index + 1,
          row: {
            nombre: row["nombre_completo"],
            producto:
              row["descripcion"] || row["producto"] || row["nombre_producto"],
            cantidad: row["cantidad"],
          },
          error: rowErr.message,
        });
      }
    }

    // Insertar detalles restantes
    if (detallesBatch.length > 0) {
      console.log(`Insertando último lote de ${detallesBatch.length} detalles`);
      for (const detalle of detallesBatch) {
        try {
          const { error: detalleError } = await supabase
            .from("detallesdonativos")
            .insert([detalle]);

          if (detalleError) {
            errors.push({ detalle, error: detalleError.message });
            console.error("Error insertando detalle final:", detalleError);
          }
        } catch (err) {
          errors.push({ detalle, error: err.message });
          console.error("Error insertando detalle final:", err);
        }
      }
    }

    // Actualizar último donativo
    if (currentDonativoId && acumuladoDetalles > 0) {
      await supabase
        .from("donativos")
        .update({
          total: acumuladoDetalles,
          total_con_descuento: acumuladoDetalles,
        })
        .eq("donativo_id", currentDonativoId);
    }

    res.json({
      message: "Donativos procesados correctamente",
      total_inserted_donativos: insertedDonativos,
      total_filas_procesadas: rows.length,
      errores: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Error general:", err);
    res.status(500).json({
      message: "Error procesando archivo",
      error: err.message,
    });
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkErr) {
      console.error("Error eliminando archivo temporal:", unlinkErr);
    }
  }
};
