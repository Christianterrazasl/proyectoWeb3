import {
  FiArrowUpRight,
  FiBriefcase,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  getAuditLogs,
  getCompanyPortfolioSummary,
  getDashboardSummary,
  getServiceKpis,
  getTransactionMonitoring,
} from "../services/reportesApi";
import { getAccessToken } from "../utils/authStorage";
import {
  buildTenancyCompanies,
  getActiveCompany,
  getCompanyStatusLabel,
} from "../utils/tenancyUi";

const sidebarItems = [
  { label: "Resumen", icon: FiGrid, active: true },
  { label: "Empresas", icon: FiHome },
  { label: "Operaciones", icon: FiCreditCard },
  { label: "Riesgo", icon: FiShield },
  { label: "Actividad", icon: FiUsers },
];

const defaultKpiCards = [
  {
    label: "Monto pendiente",
    value: "Bs. 0.00",
    detail: "0 deudas pendientes",
    icon: FiTrendingUp,
  },
  {
    label: "Empresas activas",
    value: "0",
    detail: "0 empresas en scope",
    icon: FiHome,
  },
  {
    label: "Transacciones",
    value: "0",
    detail: "0% aprobadas",
    icon: FiCreditCard,
  },
  {
    label: "Deudas en cartera",
    value: "0",
    detail: "0 transacciones fallidas",
    icon: FiArrowUpRight,
  },
];

function buildKpiCardsFromDashboard(summary) {
  if (!summary) return defaultKpiCards;

  return [
    {
      label: "Monto pendiente",
      value: `Bs. ${Number(summary.pending_amount || 0).toFixed(2)}`,
      detail: `${summary.pending_debts ?? 0} deudas pendientes`,
      icon: FiTrendingUp,
    },
    {
      label: "Empresas activas",
      value: String(summary.active_companies ?? 0),
      detail: `${summary.total_companies ?? 0} empresas en scope`,
      icon: FiHome,
    },
    {
      label: "Transacciones",
      value: String(summary.total_transactions ?? 0),
      detail: `${summary.approval_rate ?? 0}% aprobadas`,
      icon: FiCreditCard,
    },
    {
      label: "Deudas en cartera",
      value: String(summary.total_debts ?? 0),
      detail: `${summary.failed_transactions ?? 0} transacciones fallidas`,
      icon: FiArrowUpRight,
    },
  ];
}

function formatAmount(value) {
  return `Bs. ${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-BO");
}

function formatStatus(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PENDING") return "Pendiente";
  if (normalized === "PAID" || normalized === "SUCCESS") return "OK";
  if (normalized === "FAILED") return "Fallida";
  if (normalized === "CANCELLED") return "Cancelada";

  return normalized || "Sin estado";
}

function SidebarItem({ label, icon, active = false }) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      className={`lumina-sidebar-link ${active ? "is-active" : ""}`}
    >
      <IconComponent className="text-base" />
      <span>{label}</span>
    </button>
  );
}

function KpiCard({ label, value, detail, icon }) {
  const IconComponent = icon;

  return (
    <article className="lumina-kpi-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="lumina-label text-cyan-300">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200">
          <IconComponent />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{detail}</p>
    </article>
  );
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [portfolioRows, setPortfolioRows] = useState([]);
  const [serviceRows, setServiceRows] = useState([]);
  const [transactionRows, setTransactionRows] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [dashboardError, setDashboardError] = useState("");

  const {
    logout,
    user,
    memberships,
    accessibleCompanies,
    activeCompanyId,
  } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let ignore = false;

    const loadDashboard = async () => {
      try {
        const [summary, portfolio, services, transactions, auditLogs] = await Promise.all([
          getDashboardSummary(token, activeCompanyId),
          getCompanyPortfolioSummary(token, activeCompanyId),
          getServiceKpis(token, activeCompanyId),
          getTransactionMonitoring(token, activeCompanyId),
          getAuditLogs(token, activeCompanyId),
        ]);

        if (!ignore) {
          setDashboard(summary);
          setPortfolioRows(Array.isArray(portfolio) ? portfolio : []);
          setServiceRows(Array.isArray(services) ? services : []);
          setTransactionRows(Array.isArray(transactions) ? transactions : []);
          setAuditRows(Array.isArray(auditLogs) ? auditLogs : []);
          setDashboardError("");
        }
      } catch (error) {
        if (!ignore) {
          setDashboard(null);
          setPortfolioRows([]);
          setServiceRows([]);
          setTransactionRows([]);
          setAuditRows([]);
          setDashboardError(error.message || "No se pudo cargar el dashboard");
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [activeCompanyId]);

  const kpiCards = useMemo(
    () => buildKpiCardsFromDashboard(dashboard),
    [dashboard],
  );
  const tenancyCompanies = buildTenancyCompanies(
    accessibleCompanies,
    memberships,
    activeCompanyId,
  );

  const activeCompany = getActiveCompany(tenancyCompanies, activeCompanyId);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-90px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-80px] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <aside className="lumina-shell hidden w-[280px] flex-col justify-between lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-lg font-bold text-cyan-200">
                M
              </div>
              <div>
                <p className="text-base font-semibold text-slate-100">
                  MultiPagos
                </p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  Admin console
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="lumina-label text-cyan-300">Sesión</p>
              <p className="mt-3 text-sm font-medium text-slate-100">
                {user?.email || "Administrador"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                {user?.global_role || "admin"}
              </p>

              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                Tenant activo
              </p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                {activeCompany?.name || "Sin tenant asignado"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {activeCompany
                  ? `ID ${activeCompany.id} · NIT ${activeCompany.nit}`
                  : "Este usuario no tiene memberships activas."}
              </p>
            </div>

            <nav className="mt-8 flex flex-col gap-2">
              {sidebarItems.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
            </nav>
          </div>

          <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/[0.04] p-4">
            <p className="lumina-label text-cyan-300">Estado del entorno</p>
            <p className="mt-3 text-sm text-slate-300">
              Auth, tenancy y reportes administrativos ya están saliendo de los
              microservicios reales del entorno.
            </p>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="lumina-shell">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="lumina-label text-cyan-300">Lumina overview</p>
                <h1 className="lumina-headline mt-3 text-slate-100">
                  Control centralizado para empresas, riesgo y operación diaria.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                  Este panel usa tenancy desde auth y reportes reales para
                  cartera, servicios, transacciones y auditoría.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="lumina-button-secondary" onClick={() => window.location.reload()}>
                  <FiRefreshCw />
                  Actualizar vista
                </button>
                <button
                  type="button"
                  className="lumina-button-primary"
                  onClick={handleLogout}
                >
                  <FiLogOut />
                  Cerrar sesión
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="lumina-inline-stat">
                <FiUsers className="text-cyan-300" />
                {dashboard?.total_companies ?? 0} empresa(s) visibles
              </div>
              <div className="lumina-inline-stat">
                <FiBriefcase className="text-cyan-300" />
                {dashboard?.total_services ?? 0} servicio(s) en catálogo
              </div>
              <div className="lumina-inline-stat">
                <FiShield className="text-cyan-300" />
                {dashboard?.pending_debts ?? 0} deuda(s) pendientes
              </div>
              <div className="lumina-inline-stat">
                <FiArrowUpRight className="text-cyan-300" />
                {dashboard?.approval_rate ?? 0}% de aprobación
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="lumina-shell">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="lumina-label text-cyan-300">Tenancy real</p>
                  <h2 className="lumina-title mt-3 text-slate-100">
                    Contexto activo de sesión
                  </h2>
                </div>
                <span className="lumina-trust-badge">Datos desde /me</span>
              </div>

              <div className="mt-6 rounded-[24px] border border-cyan-300/12 bg-cyan-300/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Empresa activa
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-100">
                  {activeCompany?.name || "Sin tenant activo"}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {activeCompany
                    ? `ID ${activeCompany.id} · NIT ${activeCompany.nit}`
                    : "El backend no devolvió empresas accesibles para esta sesión."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200">
                    Rol global: {user?.global_role || "sin rol"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200">
                    Rol empresa: {activeCompany?.companyRole || "sin rol"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200">
                    Estado:{" "}
                    {activeCompany
                      ? getCompanyStatusLabel(activeCompany.status)
                      : "Sin estado"}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                El alcance de empresa activa también filtra los reportes cuando
                el backend recibe `X-Company-Id`.
              </p>
            </article>

            <article className="lumina-shell">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="lumina-label text-cyan-300">
                    Empresas accesibles
                  </p>
                  <h2 className="lumina-title mt-3 text-slate-100">
                    Memberships visibles para el usuario
                  </h2>
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {tenancyCompanies.length} empresa(s)
                </span>
              </div>

              {tenancyCompanies.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {tenancyCompanies.map((company) => (
                    <div
                      key={company.id}
                      className={`rounded-[24px] border p-4 ${
                        company.isActiveCompany
                          ? "border-cyan-300/25 bg-cyan-300/10"
                          : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-slate-100">
                            {company.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            NIT {company.nit} ·{" "}
                            {getCompanyStatusLabel(company.status)} ·{" "}
                            {company.active ? "Activa" : "Inactiva"}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                            Rol empresa · {company.companyRole}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            company.isActiveCompany
                              ? "bg-cyan-300/20 text-cyan-200"
                              : "bg-white/8 text-slate-300"
                          }`}
                        >
                          {company.isActiveCompany
                            ? "Tenant activo"
                            : "Disponible"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-white/10 p-5 text-sm text-slate-400">
                  No hay empresas accesibles en la sesión actual.
                </div>
              )}
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardError && (
              <div className="md:col-span-2 xl:col-span-4 rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
                 {dashboardError} — algunos bloques quedaron vacíos hasta el próximo refresh.
              </div>
            )}
            {kpiCards.map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <article className="lumina-shell">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="lumina-label text-cyan-300">
                    Cartera por empresa
                  </p>
                  <h2 className="lumina-title mt-3 text-slate-100">
                    Resumen real del portafolio administrativo
                  </h2>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8 bg-slate-950/45">
                <div className="hidden grid-cols-[1.4fr_1fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-white/8 px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-slate-500 md:grid">
                  <span>Empresa</span>
                  <span>Estado tenant</span>
                  <span>Disponibilidad</span>
                  <span>Deudas</span>
                  <span>Monto pendiente</span>
                </div>

                <div>
                  {portfolioRows.map((company) => (
                    <div key={company.company_id} className="lumina-table-row">
                      <div>
                        <p className="font-medium text-slate-100">
                          {company.company_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400 md:hidden">
                          {formatAmount(company.pending_amount)} pendientes
                        </p>
                      </div>
                      <p className="hidden text-sm text-slate-300 md:block">
                        {getCompanyStatusLabel(company.company_status)}
                      </p>
                      <div>
                        <span
                          className={`lumina-status-pill ${
                            company.company_active === false
                              ? "is-warning"
                              : "is-success"
                          }`}
                        >
                          {company.company_active ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {company.pending_debts}/{company.total_debts}
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        {formatAmount(company.pending_amount)}
                      </p>
                    </div>
                  ))}
                  {portfolioRows.length === 0 && (
                    <div className="px-5 py-6 text-sm text-slate-400">
                      No hay filas de cartera para el alcance actual.
                    </div>
                  )}
                </div>
              </div>
            </article>

            <div className="space-y-6">
              <article className="lumina-shell">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">
                      Servicios priorizados
                    </p>
                    <h2 className="lumina-title mt-3 text-slate-100">
                      Mayor cartera pendiente
                    </h2>
                  </div>
                  <span className="lumina-trust-badge">Reportes reales</span>
                </div>

                <div className="mt-6 space-y-4">
                  {serviceRows
                    .slice()
                    .sort((left, right) => Number(right.pending_amount || 0) - Number(left.pending_amount || 0))
                    .slice(0, 5)
                    .map((service) => (
                      <div key={`${service.company_id}-${service.service_id}`} className="lumina-activity-item">
                        <div className="lumina-activity-dot is-info" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-medium text-slate-100">
                              {service.service_name || service.service_id}
                            </p>
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              {formatAmount(service.pending_amount)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {service.company_name || `Empresa ${service.company_id}`} · {service.pending_debts} pendiente(s) de {service.total_debts} deuda(s)
                          </p>
                        </div>
                      </div>
                    ))}
                  {serviceRows.length === 0 && (
                    <p className="mt-5 text-sm leading-6 text-slate-400">
                      No hay KPIs de servicios para mostrar en este alcance.
                    </p>
                  )}
                </div>
              </article>

              <article className="lumina-shell">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">
                      Operación reciente
                    </p>
                    <h2 className="lumina-title mt-3 text-slate-100">
                      Transacciones y auditoría
                    </h2>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                    Backend real
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {transactionRows.slice(0, 3).map((item) => (
                    <div key={item.transaction_id} className="lumina-activity-item">
                      <div
                        className={`lumina-activity-dot ${item.status === "FAILED" ? "is-warning" : "is-success"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-medium text-slate-100">
                            {item.service_name || item.service_id || item.transaction_id}
                          </p>
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {item.company_name || `Empresa ${item.company_id}`} · {formatStatus(item.status)} · {formatAmount(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditRows.slice(0, 2).map((item) => (
                    <div key={`audit-${item.id}-${item.created_at}`} className="lumina-activity-item">
                      <div className="lumina-activity-dot is-neutral" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-medium text-slate-100">
                            {item.action || "Actividad administrativa"}
                          </p>
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {(item.actor_email || "Sistema")} · {item.resource_type || "reporte"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {transactionRows.length === 0 && auditRows.length === 0 && (
                    <p className="text-sm leading-6 text-slate-400">
                      No hay actividad reciente para el alcance actual.
                    </p>
                  )}
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
