import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiExternalLink, FiHome } from "react-icons/fi";
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
          setError(err.message || "No se pudo cargar el comprobante.");
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
          <PublicState variant="loading" title="Cargando comprobante..." />
        </div>
      </div>
    );
  }

  if (error && !payment && !receiptContext.receiptHash) {
    return (
      <div className="lumina-page relative overflow-hidden">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <PublicState variant="error" title="No se pudo abrir el comprobante" description={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-90px] top-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <Link
            to={receiptModel.returnToDebtsHref}
            className="inline-flex w-max items-center gap-2 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            <FiArrowLeft />
            Volver
          </Link>

          <h1 className="lumina-headline mt-4 text-slate-100">{receiptModel.title}</h1>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="lumina-inline-stat">
              Estado: {receiptModel.statusLabel}
            </div>
            <div className="lumina-inline-stat">
              <FiDownload className="text-cyan-300" /> {receiptModel.receiptLabel}
            </div>
          </div>
        </section>

        <section className="mt-6 lumina-shell">
          <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-6">
            <p className="break-all text-2xl font-semibold text-white">
              {receiptModel.receiptLabel}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {receiptModel.detailItems.map((item) => (
                <div key={item.key} className="lumina-metric-card">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/75">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              Ver deudas
            </Link>

            <Link
              to="/"
              className="lumina-button-secondary inline-flex w-full cursor-pointer sm:w-auto"
            >
              <FiHome />
              Inicio
            </Link>
          </div>

          {refreshNotice ? (
            <div className="mt-4 rounded-[20px] border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {refreshNotice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default PublicReceiptPage;
