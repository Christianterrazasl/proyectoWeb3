import * as XLSX from "xlsx";
/**
 * Convierte valores problemáticos (null, undefined, objetos) en algo exportable.
 * Esto evita que el CSV/XLSX termine con valores rotos o difíciles de leer.
 */
function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

/**
 * Escapa correctamente una celda CSV.
 * Si hay comas, comillas o saltos de línea, envolvemos el valor en comillas.
 */
function escapeCsvValue(value) {
  const normalized = String(normalizeCellValue(value));

  if (
    normalized.includes('"') ||
    normalized.includes(",") ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

/**
 * Convierte nuestras filas internas a un shape más amigable para exportación.
 * Aquí usamos los headers visibles que verá el usuario final en Excel/CSV.
 */
function projectRows(rows, columns) {
  return rows.map((row) => {
    const projected = {};

    for (const column of columns) {
      projected[column.header] = normalizeCellValue(row[column.key]);
    }

    return projected;
  });
}

/**
 * Genera un buffer CSV con BOM UTF-8.
 * El BOM ayuda a que Excel abra mejor acentos y caracteres especiales.
 */
export function buildCsvBuffer(rows, columns) {
  const headers = columns.map((column) => column.header);
  const lines = [headers.map(escapeCsvValue).join(",")];

  for (const row of rows) {
    lines.push(
      columns.map((column) => escapeCsvValue(row[column.key])).join(","),
    );
  }

  return Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8");
}

/**
 * Genera un archivo Excel real (.xlsx) usando la misma tabla lógica.
 * Reutilizamos las mismas columnas para no duplicar reglas entre CSV y Excel.
 */
export function buildXlsxBuffer(rows, columns, sheetName = "Reporte") {
  const headers = columns.map((column) => column.header);
  const projectedRows = projectRows(rows, columns);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);

  if (projectedRows.length > 0) {
    XLSX.utils.sheet_add_json(worksheet, projectedRows, {
      header: headers,
      skipHeader: true,
      origin: "A2",
    });
  }

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });
}
