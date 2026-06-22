import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
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
      return;
    }

    let ignore = false;

    const loadDebts = async () => {
      setLoading(true);
      setError("");

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
    <div className="w-full min-h-screen bg-primary text-white flex flex-col">
      <section className="py-4 px-8 bg-neutral text-black">
        <h1 className="text-[20px] font-semibold">MultiPagos</h1>
        <p className="text-sm text-gray-600 mt-1">
          {provider?.name || "Consulta pública de deudas"}
        </p>
      </section>

      <section className="w-full flex items-center justify-center flex-1 py-8 px-6">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] w-full">
            <AiOutlineLoading3Quarters className="text-5xl text-white animate-spin" />
          </div>
        ) : error ? (
          <div className="max-w-[900px] w-full bg-neutral text-black rounded-3xl p-8">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto w-full pt-4 pb-8 gap-8 px-8 bg-neutral min-h-[400px] text-black rounded-3xl flex flex-col lg:flex-row">
            <div className="flex-1 flex-shrink-0">
              <div className="mb-6">
                <h2 className="text-[32px] font-semibold">Deudas</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Proveedor: {provider?.name || idProveedor}
                </p>
                <p className="text-sm text-gray-600">
                  Cliente: {customerRef}
                </p>
              </div>

              {deudas.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {deudas.map((deuda) => {
                    const selected = selectedDeudaId === deuda.id;

                    return (
                      <button
                        key={deuda.id}
                        type="button"
                        className={`text-left flex flex-col gap-2 p-4 rounded-xl border ${
                          selected
                            ? "bg-primary text-white border-primary"
                            : "bg-gray-100 text-black border-gray-200"
                        }`}
                        onClick={() => setSelectedDeudaId(deuda.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold">
                            Servicio: {deuda.serviceId}
                          </p>
                          <p className="font-semibold">
                            {formatAmount(deuda.amount)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span>Periodo: {deuda.period}</span>
                          <span>Vence: {formatDate(deuda.dueDate)}</span>
                        </div>

                        <p className="text-sm opacity-80">
                          Estado: {deuda.status}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[16px] text-gray-500 py-12">
                  No hay deudas pendientes para este proveedor y cliente.
                </p>
              )}
            </div>

            <div className="flex-1 flex-shrink-0">
              <h2 className="text-[32px] font-semibold mb-4 text-end">
                Siguiente paso
              </h2>

              {selectedDeuda ? (
                <div className="flex flex-col gap-4 bg-gray-100 rounded-2xl p-6">
                  <p className="font-semibold text-lg">
                    Deuda seleccionada
                  </p>

                  <p>
                    <strong>ID:</strong> {selectedDeuda.id}
                  </p>
                  <p>
                    <strong>Servicio:</strong> {selectedDeuda.serviceId}
                  </p>
                  <p>
                    <strong>Periodo:</strong> {selectedDeuda.period}
                  </p>
                  <p>
                    <strong>Monto:</strong> {formatAmount(selectedDeuda.amount)}
                  </p>
                  <p>
                    <strong>Vence:</strong> {formatDate(selectedDeuda.dueDate)}
                  </p>

                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                    Slice 4 termina aquí: ya estás leyendo deudas REALES.
                    El QR, la confirmación, el estado y el comprobante conviene
                    hacerlo en el Slice 5.
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[240px] bg-gray-100 rounded-2xl text-gray-500 text-center p-6">
                  Selecciona una deuda para preparar el flujo de pago del
                  siguiente slice.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DeudasPage;