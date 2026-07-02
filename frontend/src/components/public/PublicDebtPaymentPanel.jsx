import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiCreditCard, FiRefreshCcw } from "react-icons/fi";

const toneStyles = {
  neutral: "border-white/8 bg-white/[0.03]",
  info: "border-cyan-400/20 bg-cyan-500/10",
  success: "border-emerald-400/25 bg-emerald-500/10",
  error: "border-rose-400/25 bg-rose-500/10",
};

const PublicDebtPaymentPanel = ({
  selectedDeuda,
  selectionModel,
  paymentStageModel,
  qrCode,
  transactionId,
  onGenerateQr,
  onConfirmPayment,
  onResetPayment,
}) => {
  return (
    <article className="lumina-shell">
      <h2 className="lumina-title text-slate-100">Pago</h2>

      <div className="mt-6 flex flex-col gap-4">
        <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/[0.05] p-6">
          <h3 className="text-2xl font-semibold text-slate-100">
            {selectedDeuda?.serviceId || "Selecciona una deuda"}
          </h3>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {selectionModel.summaryItems.map((item) => (
              <div key={item.key} className="lumina-metric-card">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-base font-medium text-slate-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 lumina-metric-card">
            <div className="flex items-center gap-2 text-cyan-300">
              <FiCreditCard />
              <span className="lumina-label text-cyan-300">Monto</span>
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-100">
              {selectionModel.selectedAmountLabel}
            </p>
          </div>
        </div>

        <div
          className={`rounded-[24px] border p-6 ${toneStyles[paymentStageModel.tone] || toneStyles.neutral}`}
        >
          <h3 className="text-xl font-semibold text-slate-100">
            {paymentStageModel.title}
          </h3>

          {paymentStageModel.showQrCard && qrCode ? (
            <div className="mt-5 flex flex-col items-center gap-4 rounded-[24px] border border-white/10 bg-slate-950/35 p-6 text-center">
              <img
                src={qrCode}
                alt="Código QR de pago"
                className="h-44 w-44 rounded-2xl bg-white p-3 sm:h-52 sm:w-52"
              />
              {transactionId ? (
                <p className="text-sm text-slate-300">{transactionId}</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {paymentStageModel.canGenerateQr ? (
              <button
                type="button"
                className="lumina-button-primary w-full cursor-pointer sm:w-auto"
                onClick={onGenerateQr}
              >
                {paymentStageModel.primaryActionLabel}
              </button>
            ) : null}

            {paymentStageModel.canConfirmPayment ? (
              <button
                type="button"
                className="lumina-button-primary w-full cursor-pointer sm:w-auto"
                onClick={onConfirmPayment}
              >
                {paymentStageModel.primaryActionLabel}
              </button>
            ) : null}

            {paymentStageModel.canReset ? (
              <button
                type="button"
                className="lumina-button-secondary w-full cursor-pointer sm:w-auto"
                onClick={onResetPayment}
              >
                <FiRefreshCcw />
                {paymentStageModel.secondaryActionLabel}
              </button>
            ) : null}

            {paymentStageModel.busyLabel ? (
              <div className="flex items-center gap-3 text-cyan-300">
                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                <span className="text-sm">{paymentStageModel.busyLabel}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PublicDebtPaymentPanel;
