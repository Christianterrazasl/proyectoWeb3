import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        Selector tenancy
      </p>
      <label className="mt-3 block text-sm text-gray-700" htmlFor="proveedor-active-company">
        Elegí la empresa activa para esta sesión.
      </label>
      <select
        id="proveedor-active-company"
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 mt-3"
        value={activeCompanyId ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} · ID {company.id}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-gray-500">
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
    <div className="w-full min-h-screen bg-primary text-white flex flex-col">
      <section className="py-4 px-8 bg-neutral text-black flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold">MultiPagos — Proveedor</h1>
          <p className="text-sm text-gray-700">
            Sesión activa: {user?.email || "Usuario autenticado"}
          </p>
        </div>

        <button
          className="bg-primary text-white px-4 py-2 rounded-xl cursor-pointer"
          onClick={handleCerrarSesion}
        >
          Cerrar sesión
        </button>
      </section>

      <section className="w-full flex items-center justify-center py-8 px-8 flex-1">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          <article className="bg-neutral text-black rounded-3xl py-6 px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Tenancy real
                </p>
                <h2 className="text-[28px] font-semibold mt-2">
                  {activeCompany?.name || "Sin tenant activo"}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  {activeCompany
                    ? `ID ${activeCompany.id} · NIT ${activeCompany.nit} · ${getCompanyStatusLabel(activeCompany.status)}`
                    : "Tu sesión no tiene empresas accesibles."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-200 px-3 py-2 text-sm text-gray-700">
                  Rol global: {user?.global_role || "sin rol"}
                </span>
                <span className="rounded-full bg-gray-200 px-3 py-2 text-sm text-gray-700">
                  Rol empresa: {activeCompany?.companyRole || "sin rol"}
                </span>
                <span className="rounded-full bg-gray-200 px-3 py-2 text-sm text-gray-700">
                  Company ID activo: {activeCompanyId ?? "—"}
                </span>
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
                    className={`rounded-2xl border p-4 ${
                      company.isActiveCompany
                        ? "border-primary bg-gray-100"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-[18px]">{company.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          NIT {company.nit} · {getCompanyStatusLabel(company.status)} ·{" "}
                          {company.active ? "Activa" : "Inactiva"}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Membership: {company.companyRole}
                        </p>
                      </div>

                      <span
                          className={`rounded-full px-3 py-2 text-sm font-medium ${
                            company.isActiveCompany
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                      >
                        {company.isActiveCompany ? "Tenant activo" : "Disponible"}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                          company.isActiveCompany
                            ? "bg-primary text-white/80"
                            : "bg-gray-900 text-white"
                        }`}
                        onClick={() => setActiveCompany(company.id)}
                        disabled={company.isActiveCompany}
                      >
                        {company.isActiveCompany ? "Seleccionada" : "Usar esta empresa"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No hay empresas accesibles para esta sesión.
                </p>
              )}
            </div>
          </article>

          <div className="gap-8 flex flex-col lg:flex-row">
            <div className="flex-1 bg-neutral text-black rounded-3xl py-8 px-8 min-h-[400px]">
              <h2 className="text-[32px] font-semibold mb-6">Cargar deuda</h2>

              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <AiOutlineLoading3Quarters className="text-5xl text-gray-900 animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleCargarDeuda} className="flex flex-col gap-4">
                  <div>
                    <label className="text-md font-semibold text-gray-500 mb-2 block">
                      Número de documento
                    </label>
                    <input
                      type="text"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      placeholder="Ej: 1234567"
                      className="w-full p-2 border-[1px] border-gray-400 rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-md font-semibold text-gray-500 mb-2 block">
                      Concepto
                    </label>
                    <input
                      type="text"
                      value={concepto}
                      onChange={(e) => setConcepto(e.target.value)}
                      placeholder="Descripción de la deuda"
                      className="w-full p-2 border-[1px] border-gray-400 rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-md font-semibold text-gray-500 mb-2 block">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full p-2 border-[1px] border-gray-400 rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-md font-semibold text-gray-500 mb-2 block">
                      Monto (Bs.)
                    </label>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2 border-[1px] border-gray-400 rounded-sm"
                    />
                  </div>

                  {mensaje && (
                    <p
                      className={`text-[14px] ${
                        mensaje.includes("correctamente")
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {mensaje}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-3 rounded-xl cursor-pointer font-semibold"
                  >
                    Cargar
                  </button>
                </form>
              )}
            </div>

            <div className="flex-1 bg-neutral text-black rounded-3xl py-8 px-8 min-h-[400px] overflow-y-auto">
              <div className="flex gap-2 mb-6 border-b border-gray-300">
                <button
                  type="button"
                  onClick={() => setTab("pendientes")}
                  className={`px-4 py-2 text-[18px] font-semibold cursor-pointer border-b-2 -mb-px ${
                    tab === "pendientes"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={() => setTab("pagadas")}
                  className={`px-4 py-2 text-[18px] font-semibold cursor-pointer border-b-2 -mb-px ${
                    tab === "pagadas"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  Pagadas
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {deudasFiltradas.length > 0 ? (
                  deudasFiltradas.map((deuda) => (
                    <div
                      key={deuda.id}
                      className="flex flex-col gap-1 bg-gray-200 p-4 rounded-xl"
                    >
                      <p className="text-[14px] text-gray-600">
                        Doc. {deuda.documento}
                      </p>
                      <p className="font-semibold">{deuda.concepto}</p>
                      <div className="flex justify-between text-[14px] text-gray-700 mt-1">
                        <span>{deuda.monto} Bs.</span>
                        <span>Vence: {deuda.fecha}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[16px] text-gray-500 text-center py-12">
                    No hay deudas {tab === "pendientes" ? "pendientes" : "pagadas"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProveedorPage;
