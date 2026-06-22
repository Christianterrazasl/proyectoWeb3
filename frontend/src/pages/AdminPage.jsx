import {
  FiActivity,
  FiArrowUpRight,
  FiBell,
  FiBriefcase,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardSummary } from "../services/reportesApi";
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
  { label: "Actividad", icon: FiActivity },
];

const defaultKpiCards = [
  {
    label: "Volumen procesado",
    value: "Bs. 1.28M",
    detail: "+14.8% vs. semana previa",
    icon: FiTrendingUp,
  },
  {
    label: "Empresas activas",
    value: "18",
    detail: "3 nuevas este mes",
    icon: FiHome,
  },
  {
    label: "Operaciones hoy",
    value: "2,416",
    detail: "98.7% conciliadas",
    icon: FiCreditCard,
  },
  {
    label: "Alertas abiertas",
    value: "05",
    detail: "2 requieren revisión inmediata",
    icon: FiBell,
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
      icon: FiBell,
    },
  ];
}

const companies = [
  {
    name: "EnerBol Distribución",
    segment: "Servicios básicos",
    status: "Operando",
    transactions: "842 hoy",
    collection: "Bs. 312k",
  },
  {
    name: "AquaRed Metropolitana",
    segment: "Agua y saneamiento",
    status: "Monitoreo",
    transactions: "516 hoy",
    collection: "Bs. 188k",
  },
  {
    name: "NetSur Telecom",
    segment: "Telecomunicaciones",
    status: "Operando",
    transactions: "603 hoy",
    collection: "Bs. 241k",
  },
  {
    name: "Municipio Central",
    segment: "Recaudación pública",
    status: "Pendiente corte",
    transactions: "455 hoy",
    collection: "Bs. 95k",
  },
];

const activityFeed = [
  {
    title: "Pico transaccional detectado",
    detail: "EnerBol aumentó 22% su volumen en los últimos 15 minutos.",
    time: "Hace 4 min",
    tone: "info",
  },
  {
    title: "Conciliación manual requerida",
    detail:
      "2 operaciones de AquaRed quedaron en revisión por timeout bancario.",
    time: "Hace 11 min",
    tone: "warning",
  },
  {
    title: "Nueva empresa habilitada",
    detail:
      "SaludVital quedó visible para pruebas internas del equipo operativo.",
    time: "Hace 25 min",
    tone: "success",
  },
  {
    title: "Feed de QR estable",
    detail: "Sin incidentes críticos reportados durante la última hora.",
    time: "Hace 39 min",
    tone: "neutral",
  },
];

const chartBars = [38, 52, 47, 65, 71, 58, 82];

function SidebarItem({ label, icon: Icon, active = false }) {
  return (
    <button
      type="button"
      className={`lumina-sidebar-link ${active ? "is-active" : ""}`}
    >
      <Icon className="text-base" />
      <span>{label}</span>
    </button>
  );
}

function KpiCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="lumina-kpi-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="lumina-label text-cyan-300">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200">
          <Icon />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{detail}</p>
    </article>
  );
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  const {
    logout,
    user,
    memberships,
    accessibleCompanies,
    activeCompanyId,
    setActiveCompany,
  } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let ignore = false;

    const loadDashboard = async () => {
      try {
        const summary = await getDashboardSummary(token);
        if (!ignore) {
          setDashboard(summary);
          setDashboardError("");
        }
      } catch (error) {
        if (!ignore) {
          setDashboardError(error.message || "No se pudo cargar el dashboard");
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

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

  const handleActiveCompanyChange = (event) => {
    setActiveCompany(Number(event.target.value));
  };

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
              Auth y tenancy YA vienen de la API real. Los KPIs y métricas de
              operación siguen mock hasta conectar reportes y pagos.
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
                  Este panel mezcla tenancy REAL desde auth con bloques mock de
                  operación mientras el backend administrativo termina de
                  madurar.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="lumina-button-secondary">
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
                <FiUsers className="text-cyan-300" />4 equipos monitoreando la
                plataforma
              </div>
              <div className="lumina-inline-stat">
                <FiBriefcase className="text-cyan-300" />
                Ventana de corte: 23:30 BOT
              </div>
              <div className="lumina-inline-stat">
                <FiShield className="text-cyan-300" />
                Riesgo operativo: controlado
              </div>
              <div className="lumina-inline-stat">
                <FiArrowUpRight className="text-cyan-300" />
                SLA visual: 99.94%
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
                Este bloque YA usa tenancy real. El resto del dashboard sigue
                mock porque auth no expone KPI, riesgo, recaudación ni actividad
                operativa.
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
                {dashboardError} — mostrando valores de respaldo.
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
                    Directorio de empresas
                  </p>
                  <h2 className="lumina-title mt-3 text-slate-100">
                    Tenants priorizados para seguimiento
                  </h2>
                </div>

                <div className="relative w-full lg:max-w-xs">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="lumina-input pl-11"
                    value=""
                    readOnly
                    placeholder="Filtrar por empresa (mock)"
                  />
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8 bg-slate-950/45">
                <div className="hidden grid-cols-[1.4fr_1fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-white/8 px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-slate-500 md:grid">
                  <span>Empresa</span>
                  <span>Vertical</span>
                  <span>Estado</span>
                  <span>Operaciones</span>
                  <span>Recaudación</span>
                </div>

                <div>
                  {companies.map((company) => (
                    <div key={company.name} className="lumina-table-row">
                      <div>
                        <p className="font-medium text-slate-100">
                          {company.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400 md:hidden">
                          {company.segment}
                        </p>
                      </div>
                      <p className="hidden text-sm text-slate-300 md:block">
                        {company.segment}
                      </p>
                      <div>
                        <span
                          className={`lumina-status-pill ${
                            company.status === "Pendiente corte"
                              ? "is-warning"
                              : company.status === "Monitoreo"
                                ? "is-neutral"
                                : "is-success"
                          }`}
                        >
                          {company.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {company.transactions}
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        {company.collection}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <div className="space-y-6">
              <article className="lumina-shell">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">
                      Analítica rápida
                    </p>
                    <h2 className="lumina-title mt-3 text-slate-100">
                      Tendencia semanal
                    </h2>
                  </div>
                  <span className="lumina-trust-badge">Mock data</span>
                </div>

                <div className="mt-8 flex h-56 items-end gap-3">
                  {chartBars.map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      className="flex flex-1 flex-col items-center gap-3"
                    >
                      <div
                        className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-400/30 via-cyan-300/55 to-indigo-400/70 shadow-[0_0_22px_rgba(34,211,238,0.16)]"
                        style={{ height: `${value * 1.8}px` }}
                      />
                      <span className="text-xs text-slate-500">
                        D{index + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-400">
                  Visual simple para reservar espacio a la analítica real.
                  Cuando exista el backend, este bloque puede migrar a métricas
                  consolidadas sin rehacer la estructura.
                </p>
              </article>

              <article className="lumina-shell">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">
                      Actividad en vivo
                    </p>
                    <h2 className="lumina-title mt-3 text-slate-100">
                      Operaciones recientes
                    </h2>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                    Live mock
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {activityFeed.map((item) => (
                    <div key={item.title} className="lumina-activity-item">
                      <div
                        className={`lumina-activity-dot ${`is-${item.tone}`}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-medium text-slate-100">
                            {item.title}
                          </p>
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            {item.time}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
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
