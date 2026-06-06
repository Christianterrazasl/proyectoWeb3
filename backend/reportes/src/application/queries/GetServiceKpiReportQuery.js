export class GetServiceKpiReportQuery {
  /**
   * Query del Slice 2.
   * Lleva credenciales de sesión y, opcionalmente, el `companyId` resuelto para KPIs scopiados.
   */
  constructor({ authorization, companyId = null } = {}) {
    this.authorization = authorization;
    this.companyId = companyId ?? null;
  }
}
