// Encapsula los filtros que necesita el resumen del dashboard admin.
// Existe para desacoplar la forma del request HTTP del caso de uso,
// dejando explícito qué datos viajan hacia el handler.
export class GetDashboardSummaryQuery {
    constructor({
        authorization,
        companyId = null,
        from = null,
        to = null,
    } = {}) {
        // `companyId` llega solo cuando la sesión admin quedó acotada a una empresa.
        // `from/to` permiten resumir transacciones dentro de una ventana temporal.
        this.authorization = authorization;
        this.companyId = companyId ?? null;
        this.from = from ?? null;
        this.to = to ?? null;
    }
}
