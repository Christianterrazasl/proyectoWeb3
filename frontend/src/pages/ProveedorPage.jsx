import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const { logout, user } = useAuth();

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
        <div className="max-w-[1400px] mx-auto w-full gap-8 flex flex-col lg:flex-row">
          <div className="flex-1 bg-neutral text-black rounded-3xl py-8 px-8 min-h-[400px]">
            <h2 className="text-[32px] font-semibold mb-6">Cargar deuda</h2>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <AiOutlineLoading3Quarters className="text-5xl text-gray-900 animate-spin" />
              </div>
            ) : (
              <form
                onSubmit={handleCargarDeuda}
                className="flex flex-col gap-4"
              >
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
                  No hay deudas{" "}
                  {tab === "pendientes" ? "pendientes" : "pagadas"}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProveedorPage;
