export class GetTransactionMonitoringQuery {
  /**
   * Query del Slice 3.
   * Combina scope administrativo (`companyId`) con filtros operativos del monitoreo transaccional.
   */
  constructor({
    authorization,
    companyId = null,
    tenantId = null,
    serviceId = null,
    status = null,
    customerRef = null,
    from = null,
    to = null,
  } = {}) {
    this.authorization = authorization;
    this.companyId = companyId ?? null;
    this.tenantId = tenantId ?? null;
    this.serviceId = serviceId ?? null;
    this.status = status ?? null;
    this.customerRef = customerRef ?? null;
    this.from = from ?? null;
    this.to = to ?? null;
  }
}
