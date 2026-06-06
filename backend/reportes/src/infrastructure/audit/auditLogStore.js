import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_AUDIT_LOG_FILE_PATH =
  process.env.AUDIT_LOG_FILE_PATH ||
  fileURLToPath(new URL("../../../data/audit-logs.json", import.meta.url));

/**
 * Para esta auditoría básica guardamos la bitácora en un archivo JSON local.
 * La ventaja es que el resto del sistema no depende de este detalle técnico:
 * si mañana quieren mover la bitácora a una base de datos, solo cambia esta capa.
 */
async function ensureAuditFile(filePath) {
  await mkdir(dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(filePath, "[]", "utf8");
      return;
    }

    throw error;
  }
}

/**
 * Lee todos los registros guardados en la bitácora.
 * Si el archivo existe pero está vacío, devolvemos una colección vacía.
 */
async function readAuditEntries(filePath) {
  await ensureAuditFile(filePath);

  const raw = await readFile(filePath, "utf8");

  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Reescribe el archivo completo con la colección actualizada.
 * Para esta auditoría básica el volumen esperado es bajo, así que este enfoque es suficiente.
 */
async function writeAuditEntries(filePath, entries) {
  await writeFile(filePath, JSON.stringify(entries, null, 2), "utf8");
}

function createClientError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

/**
 * Normaliza filtros de fecha.
 * Si la fecha no tiene formato válido, preferimos fallar explícitamente.
 */
function parseOptionalDate(value, fieldName) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw createClientError(
      `El filtro '${fieldName}' debe venir en un formato de fecha válido.`,
    );
  }

  return parsed;
}

/**
 * Evalúa si un registro de auditoría cumple los filtros solicitados por el admin.
 * Aquí filtramos por acción, empresa, actor, tipo de recurso y rango de fechas.
 */
function matchesFilters(entry, filters) {
  if (filters.action && entry.action !== filters.action) {
    return false;
  }

  if (
    filters.company_id !== null &&
    filters.company_id !== undefined &&
    String(entry.company_id) !== String(filters.company_id)
  ) {
    return false;
  }

  if (
    filters.actor_user_id !== null &&
    filters.actor_user_id !== undefined &&
    String(entry.actor_user_id) !== String(filters.actor_user_id)
  ) {
    return false;
  }

  if (filters.resource_type && entry.resource_type !== filters.resource_type) {
    return false;
  }

  const createdAt = new Date(entry.created_at);

  if (filters.from && createdAt < filters.from) {
    return false;
  }

  if (filters.to && createdAt > filters.to) {
    return false;
  }

  return true;
}

export function createAuditLogStore({
  filePath = DEFAULT_AUDIT_LOG_FILE_PATH,
} = {}) {
  let writeQueue = Promise.resolve();

  return {
    /**
     * Guarda un registro nuevo de auditoría.
     * La estructura resultante es el "audit_log" básico del módulo.
     */
    async save(entry) {
      const operation = writeQueue.then(async () => {
        const entries = await readAuditEntries(filePath);

        const record = {
          id: randomUUID(),
          action: entry.action,
          actor_user_id: entry.actor_user_id ?? null,
          actor_email: entry.actor_email ?? null,
          company_id: entry.company_id ?? null,
          resource_type: entry.resource_type ?? null,
          resource_id: entry.resource_id ?? null,
          metadata: entry.metadata ?? {},
          created_at: new Date().toISOString(),
        };

        entries.push(record);
        await writeAuditEntries(filePath, entries);

        return record;
      });

      // Serializamos las escrituras para evitar que dos requests pisen el mismo archivo.
      writeQueue = operation.catch(() => undefined);

      return operation;
    },

    /**
     * Devuelve la bitácora filtrada y ordenada de más reciente a más antigua.
     * Esto hace la consulta más útil para paneles administrativos.
     */
    async list(filters = {}) {
      const entries = await readAuditEntries(filePath);

      const normalizedFilters = {
        action: filters.action ?? null,
        company_id: filters.company_id ?? null,
        actor_user_id: filters.actor_user_id ?? null,
        resource_type: filters.resource_type ?? null,
        from: parseOptionalDate(filters.from, "from"),
        to: parseOptionalDate(filters.to, "to"),
      };

      return entries
        .filter((entry) => matchesFilters(entry, normalizedFilters))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
  };
}

export const auditLogStore = createAuditLogStore();
