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
        <h2 className="lumina-title text-slate-100">Deudas</h2>

        <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 sm:w-max">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {selectionModel.totalPendingLabel}
          </p>
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
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="lumina-label text-cyan-300">Monto</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-100">
                      {formatAmount(deuda.amount)}
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
