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
// --------------------- MAIN FUNCTION ---------------------// --------------------- MAIN FUNCTION CORREGIDA ---------------------
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

  // MAPEO CORREGIDO según tu base de datos real
  const TIPOS_BENEFACTOR_CORREGIDO = {
    aportaciones_por_familia: 1, // Mapea a 'Individual'
    empresas_con_recibo: 2, // Mapea a 'Empresa'
    empresas_sin_recibo: 2, // Mapea a 'Empresa'
    particulares: 1, // Mapea a 'Individual'
    fundaciones: 3, // Mapea a 'ONG'
    universidades: 3, // Mapea a 'ONG'
    gobierno: 3, // Mapea a 'ONG'
  };

  // Primero, asegurarnos de que las categorías existan en la DB
  const asegurarCategorias = async () => {
    const categoriasNecesarias = [
      "alimentos",
      "art. limp.",
      "art. aseo per",
      "Papelería",
      "Art. de vestir",
      "juguetes y recreación",
      "decoración y blancos",
      "mob y equipo",
    ];

    for (const categoriaNombre of categoriasNecesarias) {
      const { data: existingCategoria } = await supabase
        .from("categoriasproductos")
        .select("categoria_producto_id")
        .eq("nombre", categoriaNombre)
        .single();

      if (!existingCategoria) {
        await supabase
          .from("categoriasproductos")
          .insert([{ nombre: categoriaNombre }]);
        console.log(`Categoría creada: ${categoriaNombre}`);
      }
    }
  };

  // Mapeo de categorías según nombres reales de la DB
  const MAPEO_CATEGORIAS = {
    alimentos: "alimentos",
    art_limp: "art. limp.",
    art_aseo_per: "art. aseo per",
    papeleria: "Papelería",
    art_de_vestir: "Art. de vestir",
    juguetes_y_recreacion: "juguetes y recreación",
    decoracion_y_blancos: "decoración y blancos",
    mob_y_equipo: "mob y equipo",
  };

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rowsRaw = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
    });

    // Encontrar fila de encabezados
    const headerRowIndex = rowsRaw.findIndex((row) =>
      row.some(
        (cell) =>
          cell && cell.toString().toLowerCase().includes("nombre completo")
      )
    );

    if (headerRowIndex === -1) {
      throw new Error("No se encontró la fila de encabezados en el Excel");
    }

    const headers = rowsRaw[headerRowIndex].map(normalizeHeader);
    const dataRows = rowsRaw
      .slice(headerRowIndex + 1)
      .filter((row) => row.length > 0);

    console.log(`Encabezados encontrados (${headers.length}):`, headers);
    console.log(`Número de filas de datos: ${dataRows.length}`);

    // Asegurar que las categorías existan
    await asegurarCategorias();

    // Precargar caches CON LOS NOMBRES CORRECTOS
    const [{ data: donadores }, { data: productos }, { data: categorias }] =
      await Promise.all([
        supabase.from("donadores").select("*"),
        supabase.from("productos").select("*"),
        supabase.from("categoriasproductos").select("*"),
      ]);

    donadores?.forEach((d) => {
      const key = d.nombre_completo?.trim().toLowerCase();
      if (key) donadorCache.set(key, d.donador_id);
    });

    productos?.forEach((p) => {
      const key = p.nombre?.trim().toLowerCase();
      if (key) productoCache.set(key, p.producto_id);
    });

    // Cache de categorías por nombre CORRECTO
    const categoriaCache = new Map();
    categorias?.forEach((c) => {
      const key = c.nombre?.trim().toLowerCase();
      if (key) categoriaCache.set(key, c.categoria_producto_id);
    });

    await setCurrentUser(req.user.usuario_id);

    // Procesar cada fila
    for (let i = 0; i < dataRows.length; i++) {
      const rowArray = dataRows[i];
      const row = {};

      headers.forEach((header, index) => {
        row[header] = rowArray[index] !== undefined ? rowArray[index] : null;
      });

      try {
        // Validaciones básicas
        const nombre = (row["nombre_completo"] || "").toString().trim();
        const descripcionProducto = (row["descripcion"] || "")
          .toString()
          .trim();
        const cantidad = parseNumber(row["cantidad"]);

        if (
          !nombre ||
          nombre === "Sin nombre" ||
          !descripcionProducto ||
          !cantidad
        ) {
          console.log(`Fila ${i + 1} saltada: datos insuficientes`);
          continue;
        }

        // -------- DETERMINAR TIPO DE BENEFACTOR CORREGIDO --------
        let tipoBenefactorId = 1; // Default: Individual (no Particulares)

        for (const [colName, tipoId] of Object.entries(
          TIPOS_BENEFACTOR_CORREGIDO
        )) {
          const valor = parseNumber(row[colName]);
          if (valor && valor > 0) {
            tipoBenefactorId = tipoId;
            break;
          }
        }

        // -------- DETERMINAR CATEGORÍA DE PRODUCTO CORREGIDO --------
        let categoriaProductoId = null;

        for (const [colName, nombreCategoriaReal] of Object.entries(
          MAPEO_CATEGORIAS
        )) {
          const valor = parseNumber(row[colName]);
          if (valor && valor > 0) {
            // Buscar por nombre real de la categoría en la DB
            categoriaProductoId = categoriaCache.get(
              nombreCategoriaReal.toLowerCase()
            );
            break;
          }
        }

        // -------- PROCESAR FECHA (igual que antes) --------
        let fecha = null;
        if (row["fecha"]) {
          const fechaStr = row["fecha"].toString();
          if (fechaStr.includes("-")) {
            fecha = fechaStr.split(" ")[0];
          } else {
            const excelDate = parseFloat(fechaStr);
            if (!isNaN(excelDate)) {
              const utcDays = Math.floor(excelDate - 25569);
              const date = new Date(utcDays * 86400 * 1000);
              fecha = date.toISOString().split("T")[0];
            }
          }
        }

        if (!fecha) {
          fecha = new Date().toISOString().split("T")[0];
        }

        // -------- PROCESAR DONADOR (con tipo corregido) --------
        const nombreLimpio = nombre.replace(/['"]/g, "").trim();
        const donadorKey = nombreLimpio.toLowerCase();
        let donadorId = donadorCache.get(donadorKey);

        if (!donadorId) {
          const { data: existingDonador } = await supabase
            .from("donadores")
            .select("donador_id")
            .ilike("nombre_completo", nombreLimpio)
            .limit(1)
            .single();

          if (existingDonador) {
            donadorId = existingDonador.donador_id;
            donadorCache.set(donadorKey, donadorId);
          } else {
            // Crear donador con tipo CORREGIDO
            const donadorObj = {
              nombre_completo: nombreLimpio,
              telefono: row["celular__telefono"]
                ? String(row["celular__telefono"])
                : null,
              correo: row["correo"]?.trim() || null,
              tipo_donador_id: tipoBenefactorId, // Usa el tipo corregido
              activo: true,
            };

            const { data: newDonador, error: donadorError } = await supabase
              .from("donadores")
              .insert([donadorObj])
              .select()
              .single();

            if (donadorError)
              throw new Error(`Error donador: ${donadorError.message}`);

            donadorId = newDonador.donador_id;
            donadorCache.set(donadorKey, donadorId);
          }
        }

        // -------- CREAR DONATIVO --------
        const precioUnitario = parseNumber(row["precio_unitario"]) || 0;
        const precioTotal =
          parseNumber(row["precio_total"]) || cantidad * precioUnitario;

        const donativoObj = {
          donador_id: donadorId,
          fecha: fecha,
          fecha_recepcion: fecha,
          usuario_id: req.user.usuario_id,
          total: precioTotal,
          total_con_descuento: precioTotal,
          recibido_por: row["nombre_del_que_recibio"] || "",
          observaciones: descripcionProducto,
        };

        const { data: newDonativo, error: donativoError } = await supabase
          .from("donativos")
          .insert([donativoObj])
          .select()
          .single();

        if (donativoError)
          throw new Error(`Error donativo: ${donativoError.message}`);

        // -------- PROCESAR PRODUCTO CON CATEGORÍA CORREGIDA --------
        const productoKey = descripcionProducto.toLowerCase();
        let productoId = productoCache.get(productoKey);

        if (!productoId) {
          const { data: existingProducto } = await supabase
            .from("productos")
            .select("producto_id")
            .ilike("nombre", descripcionProducto)
            .limit(1)
            .single();

          if (existingProducto) {
            productoId = existingProducto.producto_id;
            productoCache.set(productoKey, productoId);
          } else {
            // Crear producto con categoría (puede ser null si no se encontró)
            const productoObj = {
              nombre: descripcionProducto,
              descripcion: descripcionProducto,
              categoria_producto_id: categoriaProductoId, // Puede ser null
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

            if (productoError)
              throw new Error(`Error producto: ${productoError.message}`);

            productoId = newProducto.producto_id;
            productoCache.set(productoKey, productoId);
          }
        }

        // -------- CREAR DETALLE DEL DONATIVO --------
        const detalleObj = {
          donativo_id: newDonativo.donativo_id,
          producto_id: productoId,
          descripcion_producto: descripcionProducto,
          cantidad: cantidad,
          unidad_medida_id: 1,
          precio_unitario: precioUnitario,
          precio_total: precioTotal,
          precio_factura: precioUnitario,
        };

        const { error: detalleError } = await supabase
          .from("detallesdonativos")
          .insert([detalleObj]);

        if (detalleError)
          throw new Error(`Error detalle: ${detalleError.message}`);

        insertedDonativos++;
        console.log(
          `Donativo ${insertedDonativos} creado: ${nombreLimpio} - ${descripcionProducto} (Tipo Donador: ${tipoBenefactorId}, Categoría: ${categoriaProductoId})`
        );
      } catch (error) {
        console.error(`Error en fila ${i + 1}:`, error.message);
        errors.push({
          fila: i + 1,
          error: error.message,
          datos: {
            nombre: row["nombre_completo"],
            producto: row["descripcion"],
            cantidad: row["cantidad"],
          },
        });
      }
    }

    res.json({
      message: "Procesamiento completado con mapeos corregidos",
      total_inserted_donativos: insertedDonativos,
      total_filas_procesadas: dataRows.length,
      errores: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({
      message: "Error procesando archivo",
      error: error.message,
    });
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.error("Error eliminando archivo temporal:", unlinkError);
    }
  }
};
