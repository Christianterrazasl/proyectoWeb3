import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiCalendar, FiCreditCard, FiFileText, FiShield } from "react-icons/fi";
import { getProviderCustomerDebts } from "../services/deudasApi";

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

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
  const [searchParams] = useSearchParams();
  const customerRef = searchParams.get("customerRef")?.trim() || "";

  const [provider, setProvider] = useState(null);
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeudaId, setSelectedDeudaId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!idProveedor || !customerRef) {
      setError("Faltan datos para consultar las deudas del cliente.");
      setProvider(null);
      setDeudas([]);
      setSelectedDeudaId(null);
      return;
    }

    let ignore = false;

    const loadDebts = async () => {
      setLoading(true);
      setError("");
      setSelectedDeudaId(null);

      try {
        const data = await getProviderCustomerDebts(idProveedor, customerRef);

        if (ignore) return;

        setProvider(data.provider || null);
        setDeudas(Array.isArray(data.debts) ? data.debts : []);
      } catch (err) {
        if (ignore) return;

        setError(err.message || "No se pudieron cargar las deudas");
        setProvider(null);
        setDeudas([]);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadDebts();

    return () => {
      ignore = true;
    };
  }, [idProveedor, customerRef]);

  const selectedDeuda = useMemo(
    () => deudas.find((deuda) => deuda.id === selectedDeudaId) || null,
    [deudas, selectedDeudaId],
  );

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-90px] top-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="lumina-trust-badge">Consulta pública</span>
                <span className="lumina-trust-badge">Deudas reales</span>
              </div>
              <p className="lumina-label mt-6 text-cyan-300">Resumen del cliente</p>
              <h1 className="lumina-headline mt-4 text-slate-100">
                {provider?.name || "Consulta pública de deudas"}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Revisa las obligaciones disponibles y selecciona una deuda para preparar el siguiente paso del flujo de pago.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <div className="lumina-inline-stat">
                <FiFileText className="text-cyan-300" /> Cliente: {customerRef || "Sin referencia"}
              </div>
              <div className="lumina-inline-stat">
                <FiShield className="text-cyan-300" /> Proveedor: {provider?.name || idProveedor}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 flex-1">
          {loading ? (
            <div className="lumina-shell flex min-h-[420px] items-center justify-center">
              <AiOutlineLoading3Quarters className="text-5xl animate-spin text-cyan-300" />
            </div>
          ) : error ? (
            <div className="lumina-shell min-h-[220px]">
              <div className="rounded-[24px] border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-rose-200">
                {error}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <article className="lumina-shell">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">Deudas disponibles</p>
                    <h2 className="lumina-title mt-3 text-slate-100">Selecciona una obligación</h2>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {deudas.length} item(s)
                  </span>
                </div>

                {deudas.length > 0 ? (
                  <div className="mt-6 flex flex-col gap-4">
                    {deudas.map((deuda) => {
                      const selected = selectedDeudaId === deuda.id;

                      return (
                        <button
                          key={deuda.id}
                          type="button"
                          className={`lumina-interactive-card cursor-pointer text-left ${selected ? "is-active" : ""}`}
                          onClick={() => setSelectedDeudaId(deuda.id)}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="lumina-label text-cyan-300">Servicio</p>
                              <p className="mt-3 text-lg font-semibold text-slate-100">
                                {deuda.serviceId}
                              </p>
                              <p className="mt-2 text-sm text-slate-400">
                                Estado: {deuda.status}
                              </p>
                            </div>
                            <div className="text-left lg:text-right">
                              <p className="lumina-label text-cyan-300">Monto</p>
                              <p className="mt-3 text-xl font-semibold text-slate-100">
                                {formatAmount(deuda.amount)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                              <div className="flex items-center gap-2 text-cyan-300">
                                <FiCreditCard />
                                <span className="lumina-label text-cyan-300">Periodo</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-200">{deuda.period}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                              <div className="flex items-center gap-2 text-cyan-300">
                                <FiCalendar />
                                <span className="lumina-label text-cyan-300">Vencimiento</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-200">{formatDate(deuda.dueDate)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-8 text-center text-sm text-slate-400">
                    No hay deudas pendientes para este proveedor y cliente.
                  </div>
                )}
              </article>

              <article className="lumina-shell">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">Siguiente paso</p>
                    <h2 className="lumina-title mt-3 text-slate-100">Preparación del pago</h2>
                  </div>
                  <span className="lumina-trust-badge">Slice 4</span>
                </div>

                {selectedDeuda ? (
                  <div className="mt-6 flex flex-col gap-4">
                    <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/[0.05] p-6">
                      <p className="lumina-label text-cyan-300">Deuda seleccionada</p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-100">
                        {selectedDeuda.serviceId}
                      </h3>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">ID</p>
                          <p className="mt-2 text-base font-medium text-slate-100">{selectedDeuda.id}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Periodo</p>
                          <p className="mt-2 text-base font-medium text-slate-100">{selectedDeuda.period}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Monto</p>
                          <p className="mt-2 text-base font-medium text-slate-100">{formatAmount(selectedDeuda.amount)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vencimiento</p>
                          <p className="mt-2 text-base font-medium text-slate-100">{formatDate(selectedDeuda.dueDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm leading-6 text-amber-100">
                      Slice 4 termina aquí: ya estás leyendo deudas REALES. El QR, la confirmación, el estado y el comprobante conviene hacerlo en el Slice 5.
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-8 text-center text-sm leading-6 text-slate-400">
                    Selecciona una deuda para preparar el flujo de pago del siguiente slice.
                  </div>
                )}
              </article>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DeudasPage;
