import { Link } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PublicState from "./PublicState.jsx";
import PublicDebtCard from "./PublicDebtCard.jsx";
import { buildPublicResultsSummary } from "./publicFlowViewModels.js";

const PublicSearchResults = ({
  hasSearched,
  loadingSearch,
  lookupError,
  lookupNotice,
  debts,
  paymentRoute,
  selectedServiceName,
  companyName,
  customerRef,
}) => {
  if (!hasSearched) return null;

  const resultsSummary = buildPublicResultsSummary({
    debts,
    selectedServiceName,
    companyName,
    customerRef,
  });

  return (
    <div className="lumina-shell flex-1">
      <h3 className="mb-6 text-[20px] font-bold text-slate-100">Resultados</h3>

      {loadingSearch ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <AiOutlineLoading3Quarters className="text-4xl animate-spin text-cyan-300" />
        </div>
      ) : lookupError ? (
        <PublicState variant="error" title="Error en la consulta" description={lookupError} />
      ) : lookupNotice ? (
        <PublicState variant="success" title={lookupNotice} />
      ) : debts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {resultsSummary ? (
            <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-semibold text-cyan-100">
                  {resultsSummary.title}
                </p>
                <p className="text-2xl font-bold text-white">
                  {resultsSummary.totalAmountLabel}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {resultsSummary.detailItems.map((item) => (
                  <div key={item.key} className="lumina-metric-card">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/75">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {paymentRoute ? (
            <div className="flex justify-end">
              <Link to={paymentRoute} className="lumina-button-primary w-full md:w-auto">
                Ir a pagar
              </Link>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {debts.map((debt, idx) => (
              <PublicDebtCard
                key={debt.id || idx}
                debt={debt}
                serviceName={selectedServiceName}
              />
            ))}
          </div>
        </div>
      ) : (
        <PublicState variant="empty" title="Sin deudas pendientes" />
      )}
    </div>
  );
};

export default PublicSearchResults;
