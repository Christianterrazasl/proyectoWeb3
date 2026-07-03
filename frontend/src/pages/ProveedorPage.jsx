import React, { useCallback, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiLogOut, FiPlusCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { listProviderCatalogServices } from "../services/catalogApi";
import { createProviderDebt, listProviderDebts } from "../services/deudasApi";
import {
  buildAdminDebtPayload,
  buildCatalogServiceOptions,
} from "./adminDebtPanelModel";

function mapDebtToRow(debt) {
  const status = String(debt.status || "").toUpperCase();

  return {
    id: debt.id,
    documento: debt.customerRef,
    concepto: debt.serviceId,
    monto: debt.amount,
    fecha: debt.dueDate ? String(debt.dueDate).slice(0, 10) : "—",
    estado: status === "PAID" ? "pagada" : "pendiente",
  };
}

const ProveedorPage = () => {
  const [documento, setDocumento] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [deudas, setDeudas] = useState([]);
  const [catalogServiceOptions, setCatalogServiceOptions] = useState([]);
  const [tab, setTab] = useState("pendientes");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();
  const { logout, session, activeCompanyId, activeCompany } = useAuth();

  const loadDebts = useCallback(async () => {
    if (!session?.access || !activeCompanyId) {
      setDeudas([]);
      return;
    }

    setListLoading(true);

    try {
      const rows = await listProviderDebts({
        accessToken: session.access,
        companyId: activeCompanyId,
      });
      setDeudas(rows.map(mapDebtToRow));
    } catch (error) {
      setMensaje(error.message || "No se pudieron cargar las deudas");
      setDeudas([]);
    } finally {
      setListLoading(false);
    }
  }, [session?.access, activeCompanyId]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  useEffect(() => {
    const loadCatalogServices = async () => {
      if (!session?.access || !activeCompanyId) {
        setCatalogServiceOptions([]);
        setSelectedServiceId("");
        return;
      }

      try {
        const services = await listProviderCatalogServices(session.access);
        const options = buildCatalogServiceOptions(services);

        setCatalogServiceOptions(options);
        setSelectedServiceId((currentValue) =>
          options.some((option) => option.id === currentValue)
            ? currentValue
            : (options[0]?.id ?? ""),
        );
      } catch (error) {
        setCatalogServiceOptions([]);
        setSelectedServiceId("");
        setMensaje(error.message || "No se pudieron cargar los servicios del catálogo");
      }
    };

    loadCatalogServices();
  }, [activeCompanyId, session?.access]);

  const handleCargarDeuda = async (e) => {
    e.preventDefault();

    if (!documento.trim() || !selectedServiceId || !monto || !fecha) {
      setMensaje("Completa todos los campos");
      return;
    }

    if (!session?.access || !activeCompanyId) {
      setMensaje("Sesión inválida");
      return;
    }

    setMensaje("");
    setLoading(true);

    try {
      await createProviderDebt({
        accessToken: session.access,
        companyId: activeCompanyId,
        ...buildAdminDebtPayload({
          activeCompanyId,
          serviceId: selectedServiceId,
          documento,
          monto,
          fecha,
        }),
      });

      setDocumento("");
      setMonto("");
      setFecha("");
      setMensaje("Deuda cargada");
      setTab("pendientes");
      await loadDebts();
    } catch (error) {
      setMensaje(error.message || "No se pudo cargar la deuda");
    } finally {
      setLoading(false);
    }
  };

  const deudasFiltradas = deudas.filter((d) =>
    tab === "pendientes" ? d.estado === "pendiente" : d.estado === "pagada",
  );

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-90px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="lumina-headline text-slate-100">
                {activeCompany?.name || "Proveedor"}
              </h1>
            </div>
            <div className="flex gap-3">
              <Link to="/" className="lumina-button-secondary">
                Inicio
              </Link>
              <button
                type="button"
                className="lumina-button-primary cursor-pointer"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <FiLogOut />
                Salir
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="lumina-shell">
            <h2 className="lumina-title text-slate-100">Cargar deuda</h2>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-cyan-300" />
              </div>
            ) : (
              <form onSubmit={handleCargarDeuda} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="lumina-label mb-2 block">Documento</label>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className="lumina-input"
                  />
                </div>
                <div>
                  <label className="lumina-label mb-2 block">Servicio</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="lumina-input"
                    disabled={catalogServiceOptions.length === 0}
                  >
                    {catalogServiceOptions.length === 0 ? (
                      <option value="">Sin servicios reales en catálogo</option>
                    ) : null}
                    {catalogServiceOptions.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="lumina-label mb-2 block">Vencimiento</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="lumina-input"
                    />
                  </div>
                  <div>
                    <label className="lumina-label mb-2 block">Monto (Bs.)</label>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="lumina-input"
                    />
                  </div>
                </div>

                {mensaje ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    {mensaje}
                  </div>
                ) : null}

                <button type="submit" className="lumina-button-primary cursor-pointer">
                  <FiPlusCircle />
                  Cargar
                </button>
              </form>
            )}
          </article>

          <article className="lumina-shell">
            <div className="flex items-center justify-between gap-4">
              <h2 className="lumina-title text-slate-100">Deudas</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab("pendientes")}
                  className={`lumina-tab cursor-pointer ${tab === "pendientes" ? "is-active" : ""}`}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={() => setTab("pagadas")}
                  className={`lumina-tab cursor-pointer ${tab === "pagadas" ? "is-active" : ""}`}
                >
                  Pagadas
                </button>
              </div>
            </div>

            {listLoading ? (
              <div className="mt-6 flex min-h-[200px] items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-cyan-300" />
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {deudasFiltradas.length > 0 ? (
                  deudasFiltradas.map((deuda) => (
                    <div key={deuda.id} className="lumina-interactive-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">{deuda.concepto}</p>
                          <p className="mt-1 text-sm text-slate-200">Doc. {deuda.documento}</p>
                        </div>
                        <p className="font-semibold text-slate-100">{deuda.monto} Bs.</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">Vence: {deuda.fecha}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-200">Sin deudas</p>
                )}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
};

export default ProveedorPage;
