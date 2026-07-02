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
      <h3 className="mb-6 text-[20px] font-bold text-slate-100">
        Resultado de la consulta
      </h3>

      {loadingSearch ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <AiOutlineLoading3Quarters className="text-4xl animate-spin text-cyan-300" />
        </div>
      ) : lookupError ? (
        <PublicState
          variant="error"
          title="No se pudo completar la consulta"
          description={lookupError}
        />
      ) : lookupNotice ? (
        <PublicState
          variant="success"
          title={lookupNotice}
          description="La referencia fue validada, pero no encontramos obligaciones pendientes en el servicio seleccionado. Puedes revisar el resumen superior o cambiar de referencia."
        />
      ) : debts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {resultsSummary ? (
            <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-100">
                    {resultsSummary.title}
                  </p>
                  <p className="mt-1 text-sm text-cyan-300/80">
                    {resultsSummary.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/35 px-4 py-3 lg:min-w-[220px]">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
                    Total pendiente
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {resultsSummary.totalAmountLabel}
                  </p>
                </div>
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
            <div className="flex flex-col gap-3 rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-100">
                  Ya encontramos deudas para esta referencia
                </p>
                <p className="mt-1 text-sm text-cyan-300/80">
                  Continúa al detalle existente para revisar la lista completa,
                  validar cada periodo y seguir con el pago.
                </p>
              </div>

              <Link to={paymentRoute} className="lumina-button-primary w-full md:w-auto">
                Continuar al detalle de pago
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
        <PublicState
          variant="empty"
          title="No se encontraron deudas"
          description="La consulta fue exitosa, pero no hay resultados pendientes para la referencia ingresada. Puedes corregir la referencia o elegir otro servicio si corresponde."
        />
      )}
    </div>
  );
};

export default PublicSearchResults;
