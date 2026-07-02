import { FiCalendar, FiCheckCircle, FiCreditCard } from "react-icons/fi";

const PublicDebtSelectionPanel = ({
  deudas,
  selectedDeudaId,
  onSelectDebt,
  selectionModel,
  formatAmount,
  formatDate,
}) => {
  return (
    <article className="lumina-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="lumina-label text-cyan-300">Deudas disponibles</p>
          <h2 className="lumina-title mt-3 text-slate-100">
            Revisa y selecciona qué obligación deseas pagar
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {selectionModel.headerDescription}
          </p>
        </div>

        <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 sm:w-max lg:min-w-[220px]">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">
            Total pendiente
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {selectionModel.totalPendingLabel}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cyan-200/75">
            {deudas.length} obligación(es)
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.05] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-100">
              {selectionModel.headerTitle}
            </p>
            <p className="mt-2 text-sm text-cyan-300/80">
              {selectionModel.nextStepLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/35 px-4 py-3 sm:w-max">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
              Pago actual
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {selectionModel.selectedAmountLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {selectionModel.summaryItems.map((item) => (
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

      {deudas.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {deudas.map((deuda) => {
            const selected = selectedDeudaId === deuda.id;

            return (
              <button
                key={deuda.id}
                type="button"
                className={`lumina-interactive-card cursor-pointer text-left transition-all ${selected ? "is-active border-cyan-300/45 bg-cyan-400/[0.09] shadow-[0_20px_70px_rgba(34,211,238,0.14)]" : ""}`}
                onClick={() => onSelectDebt(deuda.id)}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      {selected ? <FiCheckCircle className="text-cyan-300" /> : null}
                      {selected ? "Seleccionada" : "Disponible"}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-100">
                      {deuda.serviceId}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Estado actual: {deuda.status}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="lumina-label text-cyan-300">Monto</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-100">
                      {formatAmount(deuda.amount)}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      ID: {deuda.id}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="lumina-metric-card text-sm text-slate-300">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <FiCreditCard />
                      <span className="lumina-label text-cyan-300">Periodo</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{deuda.period}</p>
                  </div>
                  <div className="lumina-metric-card text-sm text-slate-300">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <FiCalendar />
                      <span className="lumina-label text-cyan-300">Vencimiento</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      {formatDate(deuda.dueDate)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
};

export default PublicDebtSelectionPanel;
