import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiDownload, FiExternalLink, FiHome, FiShield } from "react-icons/fi";
import PublicState from "../components/public/PublicState.jsx";
import { buildPublicReceiptPageModel } from "../components/public/publicReceiptPageViewModel.js";
import { getPayment, getReceiptUrl } from "../services/pagosApi";

const PublicReceiptPage = () => {
  const { idProveedor, transactionId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const customerRef = searchParams.get("customerRef")?.trim() || "";
  const receiptContext = useMemo(
    () => location.state?.receiptContext || {},
    [location.state],
  );
  const refreshNotice = location.state?.refreshNotice || "";
  const hasInitialPayment = Boolean(receiptContext.payment);

  const [payment, setPayment] = useState(receiptContext.payment || null);
  const [loading, setLoading] = useState(!hasInitialPayment);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadPayment() {
      if (!transactionId) {
        return;
      }

      setLoading((currentLoading) => currentLoading || !hasInitialPayment);
      setError("");

      try {
        const response = await getPayment(transactionId);

        if (!ignore) {
          setPayment(response);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "No se pudo cargar el comprobante interno.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPayment();

    return () => {
      ignore = true;
    };
  }, [hasInitialPayment, transactionId]);

  const receiptModel = useMemo(
    () =>
      buildPublicReceiptPageModel({
        providerId: idProveedor,
        providerName: receiptContext.providerName,
        customerRef: customerRef || receiptContext.customerRef,
        receiptHash: receiptContext.receiptHash,
        transactionId,
        selectedDebt: receiptContext.selectedDebt,
        payment,
      }),
    [customerRef, idProveedor, payment, receiptContext, transactionId],
  );

  if (loading && !payment && !receiptContext.receiptHash) {
    return (
      <div className="lumina-page relative overflow-hidden">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <PublicState
            variant="loading"
            title="Preparando tu comprobante..."
            description="Estamos recuperando los datos de la transacción para mostrarte el resumen interno del pago."
          />
        </div>
      </div>
    );
  }

  if (error && !payment && !receiptContext.receiptHash) {
    return (
      <div className="lumina-page relative overflow-hidden">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <PublicState
            variant="error"
            title="No pudimos abrir el comprobante"
            description={error}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-90px] top-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <div className="flex flex-col gap-6">
            <Link
              to={receiptModel.returnToDebtsHref}
              className="inline-flex w-max items-center gap-2 text-sm font-medium text-emerald-300 transition-colors hover:text-emerald-200"
            >
              <FiArrowLeft />
              Volver al detalle de deudas
            </Link>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="lumina-chip border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
                  <FiCheckCircle />
                  Pago confirmado
                </div>

                <h1 className="lumina-headline mt-4 text-slate-100">
                  {receiptModel.title}
                </h1>

                <p className="mt-3 max-w-3xl text-slate-400">
                  {receiptModel.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                <div className="lumina-inline-stat">
                  <FiShield className="text-emerald-300" /> Estado: {receiptModel.statusLabel}
                </div>
                <div className="lumina-inline-stat">
                  <FiDownload className="text-emerald-300" /> ID: {receiptModel.receiptLabel}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="lumina-shell">
            <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_20px_80px_rgba(16,185,129,0.12)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/75">
                    Comprobante interno
                  </p>
                  <p className="mt-3 break-all text-2xl font-semibold text-white">
                    {receiptModel.receiptLabel}
                  </p>
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                    Actualizando detalles del pago...
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {receiptModel.detailItems.map((item) => (
                  <div key={item.key} className="lumina-metric-card bg-white/[0.05]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <aside className="lumina-shell">
            <p className="lumina-label text-cyan-300">Siguientes acciones</p>
            <h2 className="lumina-title mt-3 text-slate-100">
              Conserva este respaldo antes de salir
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Desde aquí ya tienes un resumen interno del pago y, si lo necesitas, puedes abrir el comprobante oficial generado por el backend.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {receiptModel.canOpenOfficialReceipt ? (
                <a
                  href={getReceiptUrl(transactionId)}
                  target="_blank"
                  rel="noreferrer"
                    className="lumina-button-primary inline-flex w-full cursor-pointer sm:w-auto"
                >
                  <FiExternalLink />
                  {receiptModel.downloadLabel}
                </a>
              ) : null}

              <Link
                to={receiptModel.returnToDebtsHref}
                className="lumina-button-secondary inline-flex w-full cursor-pointer sm:w-auto"
              >
                <FiArrowLeft />
                Revisar otras deudas
              </Link>

              <Link
                to="/"
                className="lumina-button-secondary inline-flex w-full cursor-pointer sm:w-auto"
              >
                <FiHome />
                Volver al portal público
              </Link>
            </div>

            {refreshNotice ? (
              <div className="mt-6 rounded-[24px] border border-amber-300/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                {refreshNotice}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-[24px] border border-rose-300/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </div>
  );
};

export default PublicReceiptPage;
