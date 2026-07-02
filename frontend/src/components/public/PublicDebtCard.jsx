import { FaFileInvoiceDollar } from "react-icons/fa";

const PublicDebtCard = ({ debt, serviceName }) => {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-xl text-indigo-300">
          <FaFileInvoiceDollar />
        </div>

        <div>
          <p className="text-sm text-slate-300">
            Servicio: {serviceName || debt.serviceId}
          </p>
          <p className="text-sm text-slate-300">
            Periodo: {debt.period || "N/A"}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-100">
            Bs. {Number(debt.amount).toFixed(2)}
          </p>
        </div>
      </div>

      <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-300">
        Pendiente
      </span>
    </div>
  );
};

export default PublicDebtCard;
