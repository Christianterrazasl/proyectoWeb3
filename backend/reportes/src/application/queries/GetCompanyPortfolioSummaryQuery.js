export class GetCompanyPortfolioSummaryQuery {
  /**
   * Transporta el contexto mínimo del Slice 1.
   * `companyId` solo viaja cuando la lectura admin quedó scopiada por auth.
   */
  constructor({ authorization, companyId = null }) {
    this.authorization = authorization;
    this.companyId = companyId;
  }
}
