import { RegisterAuditLogCommand } from "../../../application/commands/RegisterAuditLogCommand.js";

export const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";
export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const COMPANY_EXPORT_COLUMNS = [
  { key: "company_id", header: "Company ID" },
  { key: "company_name", header: "Empresa" },
  { key: "company_status", header: "Estado empresa" },
  { key: "company_active", header: "Empresa activa" },
  { key: "total_debts", header: "Total deudas" },
  { key: "pending_debts", header: "Deudas pendientes" },
  { key: "paid_debts", header: "Deudas pagadas" },
  { key: "cancelled_debts", header: "Deudas canceladas" },
  { key: "pending_amount", header: "Monto pendiente" },
];

export const SERVICE_EXPORT_COLUMNS = [
  { key: "service_id", header: "Service ID" },
  { key: "service_name", header: "Servicio" },
  { key: "company_id", header: "Company ID" },
  { key: "company_name", header: "Empresa" },
  { key: "is_published", header: "Publicado" },
  { key: "total_debts", header: "Total deudas" },
  { key: "pending_debts", header: "Deudas pendientes" },
  { key: "paid_debts", header: "Deudas pagadas" },
  { key: "cancelled_debts", header: "Deudas canceladas" },
  { key: "pending_amount", header: "Monto pendiente" },
];

export const TRANSACTION_EXPORT_COLUMNS = [
  { key: "transaction_id", header: "Transaction ID" },
  { key: "created_at", header: "Fecha creación" },
  { key: "status", header: "Estado" },
  { key: "amount", header: "Monto" },
  { key: "company_id", header: "Company ID" },
  { key: "company_name", header: "Empresa" },
  { key: "service_id", header: "Service ID" },
  { key: "service_name", header: "Servicio" },
  { key: "customer_ref", header: "Referencia cliente" },
  { key: "receipt_hash", header: "Comprobante" },
];

export function resolveErrorStatus(error) {
  return Number.isInteger(error?.status) ? error.status : 500;
}

export function sendJsonSuccess(res, data) {
  return res.status(200).json({
    success: true,
    data,
  });
}

export function sendControllerError(res, error) {
  return res.status(resolveErrorStatus(error)).json({
    success: false,
    message: error.message,
  });
}

export function sendDownload(res, { buffer, filename, contentType }) {
  return res
    .status(200)
    .setHeader("Content-Type", contentType)
    .setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    .send(buffer);
}

/**
 * La auditoría de este slice es "best effort":
 * si fallara el guardado del log, NO rompemos la consulta o descarga principal.
 * Para este proyecto académico preferimos mantener disponible la lectura admin.
 */
export async function safeRegisterAuditLog({
  req,
  registerAuditLogHandler,
  resolveScopedCompanyId,
  action,
  resourceType,
  resourceId = null,
  metadata = {},
}) {
  try {
    await registerAuditLogHandler.execute(
      new RegisterAuditLogCommand({
        action,
        actorUserId: req.authContext?.user?.id ?? null,
        actorEmail: req.authContext?.user?.email ?? null,
        companyId: resolveScopedCompanyId(req),
        resourceType,
        resourceId,
        metadata,
      }),
    );
  } catch (error) {
    console.error("[reportes][audit] No se pudo guardar audit log:", error);
  }
}
