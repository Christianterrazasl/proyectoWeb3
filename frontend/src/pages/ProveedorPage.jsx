import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiBriefcase, FiCheckCircle, FiClock, FiLogOut, FiPlusCircle, FiShield } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  buildTenancyCompanies,
  getActiveCompany,
  getCompanyStatusLabel,
} from "../utils/tenancyUi";

function ActiveCompanySelector({ companies, activeCompanyId, onChange }) {
  if (!companies.length) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Selector tenancy
      </p>
      <label className="mt-3 block text-sm text-slate-300" htmlFor="proveedor-active-company">
        Elegí la empresa activa para esta sesión.
      </label>
      <select
        id="proveedor-active-company"
        className="lumina-input mt-3"
        value={activeCompanyId ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} · ID {company.id}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-slate-500">
        Se guarda en localStorage para rehidratar el tenant al recargar.
      </p>
    </div>
  );
}

const deudasMock = [
  {
    id: 1,
    documento: "1234567",
    concepto: "Factura marzo 2026",
    monto: 350,
    fecha: "2026-04-15",
    estado: "pendiente",
  },
  {
    id: 2,
    documento: "7654321",
    concepto: "Servicio mensual",
    monto: 120,
    fecha: "2026-04-10",
    estado: "pendiente",
  },
  {
    id: 3,
    documento: "9876543",
    concepto: "Cuota enero",
    monto: 80,
    fecha: "2026-02-28",
    estado: "pagada",
  },
];

const ProveedorPage = () => {
  const [documento, setDocumento] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [deudas, setDeudas] = useState(deudasMock);
  const [tab, setTab] = useState("pendientes");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();

  // Este bloque YA usa tenancy real desde auth.
  // La carga y el listado de deudas siguen mock hasta integrar `deudas`.
  const { logout, user, memberships, accessibleCompanies, activeCompanyId, setActiveCompany } =
    useAuth();

  const tenancyCompanies = buildTenancyCompanies(
    accessibleCompanies,
    memberships,
    activeCompanyId,
  );

  const activeCompany = getActiveCompany(tenancyCompanies, activeCompanyId);

  const handleCargarDeuda = (e) => {
    e.preventDefault();

    if (!documento.trim() || !concepto.trim() || !monto || !fecha) {
      setMensaje("Completa todos los campos");
      return;
    }

    setMensaje("");
    setLoading(true);

    setTimeout(() => {
      const nuevaDeuda = {
        id: deudas.length + 1,
        documento: documento.trim(),
        concepto,
        monto: Number(monto),
        fecha,
        estado: "pendiente",
      };

      setDeudas((prev) => [nuevaDeuda, ...prev]);
      setDocumento("");
      setConcepto("");
      setMonto("");
      setFecha("");
      setMensaje("Deuda cargada correctamente (mock)");
      setTab("pendientes");
      setLoading(false);
    }, 1500);
  };

  const deudasFiltradas = deudas.filter((d) =>
    tab === "pendientes" ? d.estado === "pendiente" : d.estado === "pagada",
  );

  const handleCerrarSesion = () => {
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="lumina-trust-badge">Proveedor</span>
                <span className="lumina-trust-badge">Tenancy real</span>
                <span className="lumina-trust-badge">Mock de negocio</span>
              </div>
              <p className="lumina-label mt-6 text-cyan-300">Sesión activa</p>
              <h1 className="lumina-headline mt-4 text-slate-100">MultiPagos — Proveedor</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Conservamos el contexto real de auth y tenancy mientras la carga y el listado de deudas siguen en modo mock controlado.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Usuario</p>
                <p className="mt-2 font-medium text-slate-100">{user?.email || "Usuario autenticado"}</p>
              </div>
              <button
                type="button"
                className="lumina-button-primary cursor-pointer"
                onClick={handleCerrarSesion}
              >
                <FiLogOut />
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="lumina-inline-stat">
              <FiShield className="text-cyan-300" /> Rol global: {user?.global_role || "sin rol"}
            </div>
            <div className="lumina-inline-stat">
              <FiBriefcase className="text-cyan-300" /> Rol empresa: {activeCompany?.companyRole || "sin rol"}
            </div>
            <div className="lumina-inline-stat">
              <FiCheckCircle className="text-cyan-300" /> Tenant activo: {activeCompany?.name || "Sin tenant"}
            </div>
            <div className="lumina-inline-stat">
              <FiClock className="text-cyan-300" /> Company ID: {activeCompanyId ?? "—"}
            </div>
          </div>
        </section>

        <section className="mt-6 flex-1">
          <div className="grid gap-6">
            <article className="lumina-shell">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="lumina-label text-cyan-300">Tenancy real</p>
                  <h2 className="lumina-title mt-3 text-slate-100">
                    {activeCompany?.name || "Sin tenant activo"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {activeCompany
                      ? `ID ${activeCompany.id} · NIT ${activeCompany.nit} · ${getCompanyStatusLabel(activeCompany.status)}`
                      : "Tu sesión no tiene empresas accesibles."}
                  </p>
                </div>

                <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-300/[0.04] px-4 py-4 text-sm text-slate-300 lg:max-w-md">
                  Este bloque YA usa auth y tenancy reales. Solo estamos alineando el lenguaje visual con Lumina.
                </div>
              </div>

              <div className="mt-6">
                <ActiveCompanySelector
                  companies={tenancyCompanies}
                  activeCompanyId={activeCompanyId}
                  onChange={setActiveCompany}
                />
              </div>

              <div className="mt-6 grid gap-3">
                {tenancyCompanies.length > 0 ? (
                  tenancyCompanies.map((company) => (
                    <div
                      key={company.id}
                      className={`lumina-interactive-card ${company.isActiveCompany ? "is-active" : ""}`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-100">{company.name}</p>
                          <p className="mt-2 text-sm text-slate-400">
                            NIT {company.nit} · {getCompanyStatusLabel(company.status)} · {company.active ? "Activa" : "Inactiva"}
                          </p>
                          <p className="mt-3 text-sm text-slate-500">
                            Membership: {company.companyRole}
                          </p>
                        </div>

                        <span className={`lumina-trust-badge ${company.isActiveCompany ? "" : "opacity-80"}`}>
                          {company.isActiveCompany ? "Tenant activo" : "Disponible"}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className={company.isActiveCompany ? "lumina-button-secondary" : "lumina-button-primary"}
                          onClick={() => setActiveCompany(company.id)}
                          disabled={company.isActiveCompany}
                        >
                          {company.isActiveCompany ? "Seleccionada" : "Usar esta empresa"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-8 text-center text-sm text-slate-400">
                    No hay empresas accesibles para esta sesión.
                  </div>
                )}
              </div>
            </article>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="lumina-shell min-h-[400px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="lumina-label text-cyan-300">Carga mock</p>
                    <h2 className="lumina-title mt-3 text-slate-100">Cargar deuda</h2>
                  </div>
                  <span className="lumina-trust-badge">Mock business flow</span>
                </div>

                {loading ? (
                  <div className="flex min-h-[280px] items-center justify-center">
                    <AiOutlineLoading3Quarters className="text-5xl animate-spin text-cyan-300" />
                  </div>
                ) : (
                  <form onSubmit={handleCargarDeuda} className="mt-6 flex flex-col gap-4">
                    <div>
                      <label className="lumina-label mb-2 block text-slate-300">
                        Número de documento
                      </label>
                      <input
                        type="text"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="Ej: 1234567"
                        className="lumina-input"
                      />
                    </div>

                    <div>
                      <label className="lumina-label mb-2 block text-slate-300">
                        Concepto
                      </label>
                      <input
                        type="text"
                        value={concepto}
                        onChange={(e) => setConcepto(e.target.value)}
                        placeholder="Descripción de la deuda"
                        className="lumina-input"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="lumina-label mb-2 block text-slate-300">
                          Fecha de vencimiento
                        </label>
                        <input
                          type="date"
                          value={fecha}
                          onChange={(e) => setFecha(e.target.value)}
                          className="lumina-input"
                        />
                      </div>

                      <div>
                        <label className="lumina-label mb-2 block text-slate-300">
                          Monto (Bs.)
                        </label>
                        <input
                          type="number"
                          value={monto}
                          onChange={(e) => setMonto(e.target.value)}
                          placeholder="0.00"
                          className="lumina-input"
                        />
                      </div>
                    </div>

                    {mensaje && (
                      <div
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          mensaje.includes("correctamente")
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                        }`}
                      >
                        {mensaje}
                      </div>
                    )}

                    <button type="submit" className="lumina-button-primary mt-2 cursor-pointer">
                      <FiPlusCircle />
                      Cargar
                    </button>
                  </form>
                )}
              </article>

              <article className="lumina-shell min-h-[400px]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="lumina-label text-cyan-300">Listado mock</p>
                    <h2 className="lumina-title mt-3 text-slate-100">Deudas cargadas</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
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

                <div className="mt-6 flex flex-col gap-4">
                  {deudasFiltradas.length > 0 ? (
                    deudasFiltradas.map((deuda) => (
                      <div key={deuda.id} className="lumina-interactive-card">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Doc. {deuda.documento}</p>
                            <p className="mt-2 text-lg font-semibold text-slate-100">{deuda.concepto}</p>
                          </div>
                          <span className="lumina-trust-badge">
                            {deuda.estado === "pendiente" ? "Pendiente" : "Pagada"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Monto</p>
                            <p className="mt-2 text-base font-medium text-slate-100">{deuda.monto} Bs.</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vencimiento</p>
                            <p className="mt-2 text-base font-medium text-slate-100">{deuda.fecha}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-8 text-center text-sm text-slate-400">
                      No hay deudas {tab === "pendientes" ? "pendientes" : "pagadas"}.
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProveedorPage;
