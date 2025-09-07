import XLSX from "xlsx";
import fs from "fs";
import { parse } from "date-fns";
import { supabase } from "../db/supabaseClient.js";

// Normalizar encabezados
const normalizeHeader = (header) => {
  if (!header) return "";
  return header
    .toString()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
};

const processExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const allRows = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const normalizedHeaders = headers.map(normalizeHeader);

    rows = rows.map((row) => {
      const mapped = {};
      normalizedHeaders.forEach((h, i) => (mapped[h] = row[headers[i]]));
      mapped["anio"] = sheetName; // Asignar año según hoja
      return mapped;
    });

    allRows.push(...rows);
  });

  return allRows;
};

export const uploadDonativos = async (req, res) => {
  const filePath = req.file.path;

  try {
    const rows = processExcel(filePath);
    let inserted = 0;
    const errors = [];

    for (const row of rows) {
      try {
        if (!row["nombre_completo"] || !row["cantidad"]) continue;

        // 1️⃣ Donador
        let { data: existingDonador } = await supabase
          .from("Donadores")
          .select("*")
          .eq("correo", row["correo"])
          .single();
        let donador_id;

        if (existingDonador) donador_id = existingDonador.donador_id;
        else {
          let { data: newDonador } = await supabase
            .from("Donadores")
            .insert([
              {
                nombre_completo: row["nombre_completo"],
                telefono: row["celular_telefono"],
                correo: row["correo"],
                fecha_nacimiento: row["dia_y_año_de_nacimiento"]
                  ? parse(
                      row["dia_y_año_de_nacimiento"],
                      "dd MMM yyyy",
                      new Date()
                    )
                  : null,
                direccion: row["direccion"],
                tipo_donador_id: 1,
                activo: true,
              },
            ])
            .select()
            .single();
          donador_id = newDonador.donador_id;
        }

        // 2️⃣ Donativo
        const total = Number(row["precio_total"]) || 0;
        const usuario_id = req.user.usuario_id;
        const { data: newDonativo } = await supabase
          .from("Donativos")
          .insert([
            {
              donador_id,
              fecha: row["fecha"] || new Date(),
              fecha_recepcion: row["fecha"] || new Date(),
              usuario_id,
              total,
              total_con_descuento: total,
              recibido_por: row["nombre_del_que_recibio"] || "",
              observaciones: row["descripcion"] || "",
            },
          ])
          .select()
          .single();

        const donativo_id = newDonativo.donativo_id;

        // 3️⃣ DetallesDonativos
        await supabase.from("DetallesDonativos").insert([
          {
            donativo_id,
            producto_id: null,
            descripcion_producto: row["descripcion"] || "",
            cantidad: Number(row["cantidad"]),
            unidad_medida_id: 1,
            precio_unitario: Number(row["precio_unitario"]) || 0,
            precio_total: total,
            precio_factura: Number(row["precio_unitario"]) || 0,
          },
        ]);

        inserted++;
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    res.json({
      message: "Donativos procesados",
      total_inserted: inserted,
      errors,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error procesando archivo", error: err.message });
  } finally {
    fs.unlinkSync(filePath);
  }
};
