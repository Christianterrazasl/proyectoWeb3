import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiFileText } from "react-icons/fi";
import { getProviderCustomerDebts } from "../services/deudasApi";
import { confirmPayment, createPaymentQr } from "../services/pagosApi";
import PublicDebtPaymentPanel from "../components/public/PublicDebtPaymentPanel.jsx";
import PublicDebtSelectionPanel from "../components/public/PublicDebtSelectionPanel.jsx";
import PublicState from "../components/public/PublicState.jsx";
import PublicFlowSteps from "../components/public/PublicFlowSteps.jsx";
import {
  buildDebtSelectionModel,
  buildPaymentStageModel,
} from "../components/public/publicPaymentFlowViewModels.js";

function formatDate(value) {
  if (!value) return "—";

  const normalizedValue = String(value).trim();
  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-BO");
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return `${amount.toFixed(2)} Bs.`;
}

const DeudasPage = () => {
  const { idProveedor } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerRef = searchParams.get("customerRef")?.trim() || "";

  const [provider, setProvider] = useState(null);
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeudaId, setSelectedDeudaId] = useState(null);
  const [error, setError] = useState("");
  const [paymentStep, setPaymentStep] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  const loadDebts = useCallback(
    async ({ showPageError = true } = {}) => {
      if (!idProveedor || !customerRef) {
        if (showPageError) {
          setError("Faltan datos para consultar las deudas.");
        }
        setProvider(null);
        setDeudas([]);
        setSelectedDeudaId(null);
        return;
      }

      setLoading(true);
      if (showPageError) {
        setError("");
      }

      try {
        const data = await getProviderCustomerDebts(idProveedor, customerRef);

        setProvider(data.provider || null);
        setDeudas(Array.isArray(data.debts) ? data.debts : []);
        setSelectedDeudaId((currentId) => {
          if (!currentId) {
            return currentId;
          }

          return (data.debts || []).some((debt) => debt.id === currentId)
            ? currentId
            : null;
        });

        return data;
      } catch (err) {
        if (showPageError) {
          setError(err.message || "No se pudieron cargar las deudas");
          setProvider(null);
          setDeudas([]);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [customerRef, idProveedor],
  );

  useEffect(() => {
    let ignore = false;

    loadDebts().catch(() => {
      if (!ignore) {
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [loadDebts]);

  const selectedDeuda = useMemo(
    () => deudas.find((deuda) => deuda.id === selectedDeudaId) || null,
    [deudas, selectedDeudaId],
  );

  const selectionModel = useMemo(
    () =>
      buildDebtSelectionModel({
        providerName: provider?.name,
        customerRef,
        debts: deudas,
        selectedDebt: selectedDeuda,
      }),
    [customerRef, deudas, provider?.name, selectedDeuda],
  );

  const paymentStageModel = useMemo(
    () =>
      buildPaymentStageModel({
        paymentStep,
        selectedDebt: selectedDeuda,
        transactionId,
        paymentError,
      }),
    [paymentError, paymentStep, selectedDeuda, transactionId],
  );

  const resetPayment = () => {
    setPaymentStep("idle");
    setPaymentError("");
    setTransactionId(null);
    setQrCode(null);
  };

  const handleGenerateQr = async () => {
    if (!selectedDeuda || !idProveedor || !customerRef) return;

    setPaymentStep("generating");
    setPaymentError("");

    try {
      const result = await createPaymentQr({
        debt_id: selectedDeuda.id,
        tenant_id: idProveedor,
        service_id: selectedDeuda.serviceId,
        customer_ref: customerRef,
        amount: selectedDeuda.amount,
      });

      setTransactionId(result.transaction_id);
      setQrCode(result.qr_code);
      setPaymentStep("qr_ready");
    } catch (err) {
      setPaymentError(err.message || "No se pudo generar el QR");
      setPaymentStep("error");
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId) return;

    setPaymentStep("confirming");
    setPaymentError("");

    try {
      const result = await confirmPayment({ transaction_id: transactionId });
      let refreshNotice = "";

      try {
        await loadDebts({ showPageError: false });
      } catch (refreshError) {
        refreshNotice =
          refreshError.message ||
          "El pago se confirmó, pero no se pudo refrescar la lista.";
      }

      navigate(
        `/deuda/${encodeURIComponent(idProveedor)}/comprobante/${encodeURIComponent(transactionId)}?customerRef=${encodeURIComponent(customerRef)}`,
        {
          state: {
            receiptContext: {
              providerName: provider?.name || idProveedor,
              customerRef,
              receiptHash: result.receipt_hash,
              transactionId,
              selectedDebt: selectedDeuda,
              payment: {
                status: "SUCCESS",
                amount: selectedDeuda?.amount,
              },
            },
            refreshNotice,
          },
        },
      );
    } catch (err) {
      setPaymentError(err.message || "No se pudo confirmar el pago");
      setPaymentStep("error");
    }
  };

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
            to="/"
            className="inline-flex w-max items-center gap-2 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            <FiArrowLeft />
            Volver
          </Link>

          <h1 className="lumina-headline mt-4 text-slate-100">
            {provider?.name || "Deudas"}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="lumina-inline-stat">
              <FiFileText className="text-cyan-300" /> {customerRef || "—"}
            </div>
          </div>

          <div className="mt-6">
            <PublicFlowSteps currentStep={3} />
          </div>
        </section>

        <section className="mt-6 flex-1">
          {loading ? (
            <PublicState variant="loading" title="Cargando deudas..." />
          ) : error ? (
            <PublicState variant="error" title="Error" description={error} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              {deudas.length > 0 ? (
                <PublicDebtSelectionPanel
                  deudas={deudas}
                  selectedDeudaId={selectedDeudaId}
                  selectionModel={selectionModel}
                  formatAmount={formatAmount}
                  formatDate={formatDate}
                  onSelectDebt={(debtId) => {
                    setSelectedDeudaId(debtId);
                    resetPayment();
                  }}
                />
              ) : (
                <article className="lumina-shell text-center">
                  <p className="text-lg font-semibold text-slate-100">
                    Sin deudas pendientes
                  </p>
                  <Link to="/" className="lumina-button-secondary mt-5 inline-flex cursor-pointer">
                    Inicio
                  </Link>
                </article>
              )}

              <PublicDebtPaymentPanel
                selectedDeuda={selectedDeuda}
                selectionModel={selectionModel}
                paymentStageModel={paymentStageModel}
                qrCode={qrCode}
                transactionId={transactionId}
                onGenerateQr={handleGenerateQr}
                onConfirmPayment={handleConfirmPayment}
                onResetPayment={resetPayment}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DeudasPage;
