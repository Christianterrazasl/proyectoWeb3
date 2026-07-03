import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiLogOut, FiPlusCircle, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  createCompanyRequest,
  deleteCompanyRequest,
  listCompaniesRequest,
} from "../services/authApi";
import {
  listAdminCompanyCatalogServices,
  syncProviderCatalog,
} from "../services/catalogApi";
import {
  createAdminProvider,
  createProviderDebt,
  deleteAdminProvider,
  listAdminProviders,
  listProviderDebts,
} from "../services/deudasApi";
import {
  getCompanyPortfolioSummary,
  getDashboardSummary,
  getTransactionMonitoring,
} from "../services/reportesApi";
import {
  buildCatalogServiceOptions,
  buildAdminDebtPayload,
  filterAdminDebtRows,
  mapAdminDebtToRow,
} from "./adminDebtPanelModel";
import {
  buildAdminProviderRows,
  buildCreateProviderNit,
} from "./adminProviderPanelModel";
import { buildTenancyCompanies, getActiveCompany } from "../utils/tenancyUi";

function formatAmount(value) {
  return `Bs. ${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-BO");
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [portfolioRows, setPortfolioRows] = useState([]);
  const [transactionRows, setTransactionRows] = useState([]);
  const [dashboardError, setDashboardError] = useState("");
  const [documento, setDocumento] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [debtRows, setDebtRows] = useState([]);
  const [debtTab, setDebtTab] = useState("pendientes");
  const [debtFeedback, setDebtFeedback] = useState("");
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [catalogServiceOptions, setCatalogServiceOptions] = useState([]);
  const [providerRows, setProviderRows] = useState([]);
  const [providerName, setProviderName] = useState("");
  const [providerDescription, setProviderDescription] = useState("");
  const [providerFeedback, setProviderFeedback] = useState("");
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerSubmitting, setProviderSubmitting] = useState(false);
  const [deletingProviderId, setDeletingProviderId] = useState(null);

  const {
    logout,
    session,
    memberships,
    accessibleCompanies,
    activeCompanyId,
    setActiveCompany,
    refreshSession,
  } = useAuth();

  const tenancyCompanies = buildTenancyCompanies(
    accessibleCompanies,
    memberships,
    activeCompanyId,
  );
  const activeCompany = getActiveCompany(tenancyCompanies, activeCompanyId);
  const visibleDebtRows = useMemo(
    () => filterAdminDebtRows(debtRows, debtTab),
    [debtRows, debtTab],
  );
  const activeProviderRows = useMemo(
    () => providerRows.filter((provider) => provider.active && provider.providerActive),
    [providerRows],
  );

  const loadCatalogServices = useCallback(async () => {
    if (!session?.access || !activeCompanyId) {
      setCatalogServiceOptions([]);
      setSelectedServiceId("");
      return;
    }

    try {
      const services = await listAdminCompanyCatalogServices(session.access, activeCompanyId);
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
      setDebtFeedback(error.message || "No se pudieron cargar los servicios del catálogo");
    }
  }, [activeCompanyId, session?.access]);

  const loadAdminProviders = useCallback(async () => {
    if (!session?.access) {
      setProviderRows([]);
      return;
    }

    setProviderLoading(true);

    try {
      const [companies, providers] = await Promise.all([
        listCompaniesRequest(session.access),
        listAdminProviders(session.access),
      ]);

      setProviderRows(buildAdminProviderRows(companies, providers));
      setProviderFeedback("");
    } catch (error) {
      setProviderRows([]);
      setProviderFeedback(error.message || "No se pudieron cargar los proveedores");
    } finally {
      setProviderLoading(false);
    }
  }, [session?.access]);

  const loadAdminDebts = useCallback(async () => {
    if (!session?.access || !activeCompanyId) {
      setDebtRows([]);
      return;
    }

    setDebtLoading(true);

    try {
      const rows = await listProviderDebts({
        accessToken: session.access,
        companyId: activeCompanyId,
      });
      setDebtRows(rows.map(mapAdminDebtToRow));
      setDebtFeedback("");
    } catch (error) {
      setDebtRows([]);
      setDebtFeedback(error.message || "No se pudieron cargar las deudas");
    } finally {
      setDebtLoading(false);
    }
  }, [activeCompanyId, session?.access]);

  useEffect(() => {
    const token = session?.access;
    if (!token) return;

    let ignore = false;

    const loadDashboard = async () => {
      try {
        const [summary, portfolio, transactions] = await Promise.all([
          getDashboardSummary(token, activeCompanyId),
          getCompanyPortfolioSummary(token, activeCompanyId),
          getTransactionMonitoring(token, activeCompanyId),
        ]);

        if (!ignore) {
          setDashboard(summary);
          setPortfolioRows(Array.isArray(portfolio) ? portfolio : []);
          setTransactionRows(Array.isArray(transactions) ? transactions : []);
          setDashboardError("");
        }
      } catch (error) {
        if (!ignore) {
          setDashboard(null);
          setPortfolioRows([]);
          setTransactionRows([]);
          setDashboardError(error.message || "No se pudo cargar el panel");
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [activeCompanyId, session?.access]);

  useEffect(() => {
    loadAdminDebts();
  }, [loadAdminDebts]);

  useEffect(() => {
    loadAdminProviders();
  }, [loadAdminProviders]);

  useEffect(() => {
    loadCatalogServices();
  }, [loadCatalogServices]);

  const handleCreateProvider = async (event) => {
    event.preventDefault();

    if (!providerName.trim()) {
      setProviderFeedback("Ingresa el nombre del proveedor");
      return;
    }

    if (!session?.access) {
      setProviderFeedback("Sesión inválida");
      return;
    }

    setProviderSubmitting(true);
    setProviderFeedback("");

    try {
      const company = await createCompanyRequest(session.access, {
        name: providerName.trim(),
        nit: buildCreateProviderNit(providerName),
        description: providerDescription.trim() || undefined,
        category: "Servicios",
      });

      await createAdminProvider({
        accessToken: session.access,
        tenantId: company.id,
        name: company.name,
        description: providerDescription.trim() || undefined,
      });

      try {
        await syncProviderCatalog(session.access, {
          companyId: company.id,
          name: company.name,
        });
      } catch (catalogError) {
        console.warn("Catalog sync failed:", catalogError);
      }

      setProviderName("");
      setProviderDescription("");
      setProviderFeedback("Proveedor creado");
      await Promise.all([loadAdminProviders(), refreshSession()]);
    } catch (error) {
      setProviderFeedback(error.message || "No se pudo crear el proveedor");
    } finally {
      setProviderSubmitting(false);
    }
  };

  const handleDeleteProvider = async (providerId, providerNameLabel) => {
    if (!session?.access) {
      return;
    }

    const confirmed = globalThis.confirm?.(
      `¿Eliminar el proveedor "${providerNameLabel}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingProviderId(providerId);
    setProviderFeedback("");

    try {
      await deleteCompanyRequest(session.access, providerId);
      await deleteAdminProvider(session.access, providerId);
      setProviderFeedback("Proveedor eliminado");
      await Promise.all([loadAdminProviders(), refreshSession()]);
    } catch (error) {
      setProviderFeedback(error.message || "No se pudo eliminar el proveedor");
    } finally {
      setDeletingProviderId(null);
    }
  };

  const handleCreateDebt = async (event) => {
    event.preventDefault();

    if (!documento.trim() || !selectedServiceId || !monto || !fecha) {
      setDebtFeedback("Completa todos los campos");
      return;
    }

    if (!session?.access || !activeCompanyId) {
      setDebtFeedback("Selecciona una empresa");
      return;
    }

    setDebtSubmitting(true);
    setDebtFeedback("");

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
      setDebtTab("pendientes");
      setDebtFeedback("Deuda creada");
      await loadAdminDebts();
    } catch (error) {
      setDebtFeedback(error.message || "No se pudo crear la deuda");
    } finally {
      setDebtSubmitting(false);
    }
  };

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-90px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="lumina-headline text-slate-100">Administración</h1>
            <div className="flex flex-wrap gap-3">
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

          {tenancyCompanies.length > 0 ? (
            <select
              className="lumina-input mt-6 max-w-md"
              value={activeCompanyId ?? ""}
              onChange={(event) => setActiveCompany(event.target.value)}
            >
              {tenancyCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          ) : null}
        </section>

        {dashboardError ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {dashboardError}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="lumina-kpi-card">
            <p className="lumina-label text-cyan-300">Pendiente</p>
            <p className="mt-3 text-3xl font-semibold text-slate-100">
              {formatAmount(dashboard?.pending_amount)}
            </p>
          </div>
          <div className="lumina-kpi-card">
            <p className="lumina-label text-cyan-300">Empresas</p>
            <p className="mt-3 text-3xl font-semibold text-slate-100">
              {dashboard?.active_companies ?? 0}
            </p>
          </div>
          <div className="lumina-kpi-card">
            <p className="lumina-label text-cyan-300">Transacciones</p>
            <p className="mt-3 text-3xl font-semibold text-slate-100">
              {dashboard?.total_transactions ?? 0}
            </p>
          </div>
          <div className="lumina-kpi-card">
            <p className="lumina-label text-cyan-300">Deudas</p>
            <p className="mt-3 text-3xl font-semibold text-slate-100">
              {dashboard?.total_debts ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="lumina-shell">
            <h2 className="lumina-title text-slate-100">
              Deudas · {activeCompany?.name || "—"}
            </h2>

            {debtSubmitting ? (
              <div className="mt-6 flex min-h-[200px] items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-cyan-300" />
              </div>
            ) : (
              <form className="mt-6 flex flex-col gap-4" onSubmit={handleCreateDebt}>
                <input
                  type="text"
                  value={documento}
                  onChange={(event) => setDocumento(event.target.value)}
                  placeholder="Documento"
                  className="lumina-input"
                />
                <select
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="date"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                    className="lumina-input"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(event) => setMonto(event.target.value)}
                    placeholder="Monto"
                    className="lumina-input"
                  />
                </div>
                {debtFeedback ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    {debtFeedback}
                  </div>
                ) : null}
                <button type="submit" className="lumina-button-primary">
                  <FiPlusCircle />
                  Crear deuda
                </button>
              </form>
            )}
          </article>

          <article className="lumina-shell">
            <div className="flex items-center justify-between gap-4">
              <h2 className="lumina-title text-slate-100">Listado</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`lumina-tab ${debtTab === "pendientes" ? "is-active" : ""}`}
                  onClick={() => setDebtTab("pendientes")}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  className={`lumina-tab ${debtTab === "pagadas" ? "is-active" : ""}`}
                  onClick={() => setDebtTab("pagadas")}
                >
                  Pagadas
                </button>
                <button
                  type="button"
                  className="lumina-button-secondary"
                  onClick={loadAdminDebts}
                  disabled={debtLoading}
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>

            {debtLoading ? (
              <div className="mt-6 flex min-h-[200px] items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-cyan-300" />
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {visibleDebtRows.length > 0 ? (
                  visibleDebtRows.map((deuda) => (
                    <div key={deuda.id} className="lumina-interactive-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">{deuda.concepto}</p>
                          <p className="mt-1 text-sm text-slate-200">Doc. {deuda.documento}</p>
                        </div>
                        <p className="font-semibold text-slate-100">{formatAmount(deuda.monto)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-200">Sin deudas</p>
                )}
              </div>
            )}
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="lumina-shell">
            <h2 className="lumina-title text-slate-100">Proveedores</h2>

            {providerSubmitting ? (
              <div className="mt-6 flex min-h-[200px] items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-cyan-300" />
              </div>
            ) : (
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleCreateProvider}
              >
                <input
                  type="text"
                  value={providerName}
                  onChange={(event) => setProviderName(event.target.value)}
                  placeholder="Nombre del proveedor"
                  className="lumina-input"
                />
                <input
                  type="text"
                  value={providerDescription}
                  onChange={(event) => setProviderDescription(event.target.value)}
                  placeholder="Descripción"
                  className="lumina-input"
                />
                {providerFeedback ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    {providerFeedback}
                  </div>
                ) : null}
                <button type="submit" className="lumina-button-primary">
                  <FiPlusCircle />
                  Agregar proveedor
                </button>
              </form>
            )}
          </article>

          <article className="lumina-shell">
            <div className="flex items-center justify-between gap-4">
              <h2 className="lumina-title text-slate-100">Listado</h2>
              <button
                type="button"
                className="lumina-button-secondary"
                onClick={loadAdminProviders}
                disabled={providerLoading}
              >
                <FiRefreshCw />
              </button>
            </div>

            {providerLoading ? (
              <div className="mt-6 flex min-h-[200px] items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-cyan-300" />
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {activeProviderRows.length > 0 ? (
                  activeProviderRows.map((provider) => (
                    <div key={provider.id} className="lumina-interactive-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">
                            {provider.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            NIT {provider.nit}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="lumina-button-secondary cursor-pointer text-rose-200"
                          onClick={() =>
                            handleDeleteProvider(provider.id, provider.name)
                          }
                          disabled={deletingProviderId === provider.id}
                        >
                          <FiTrash2 />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-200">
                    Sin proveedores activos
                  </p>
                )}
              </div>
            )}
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="lumina-shell">
            <h2 className="lumina-title text-slate-100">Cartera</h2>
            <div className="mt-6 flex flex-col gap-3">
              {portfolioRows.length > 0 ? (
                portfolioRows.map((company) => (
                  <div key={company.company_id} className="lumina-interactive-card">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-100">{company.company_name}</p>
                      <p className="text-sm text-slate-200">
                        {formatAmount(company.pending_amount)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      {company.pending_debts}/{company.total_debts} deudas
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-200">Sin datos</p>
              )}
            </div>
          </article>

          <article className="lumina-shell">
            <h2 className="lumina-title text-slate-100">Transacciones</h2>
            <div className="mt-6 flex flex-col gap-3">
              {transactionRows.slice(0, 8).map((item) => (
                <div key={item.transaction_id} className="lumina-interactive-card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-100">
                      {item.service_name || item.service_id || item.transaction_id}
                    </p>
                    <p className="text-sm text-slate-200">{formatAmount(item.amount)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              ))}
              {transactionRows.length === 0 ? (
                <p className="text-sm text-slate-200">Sin transacciones</p>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
