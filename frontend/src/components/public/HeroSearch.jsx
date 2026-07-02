import { FiGrid, FiSearch, FiShield } from "react-icons/fi";

const HeroSearch = ({
  searchTerm,
  onSearchChange,
  totalCompanies,
  totalServices,
  guidance,
}) => {
  return (
    <section className="lumina-shell">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <span className="lumina-trust-badge">Portal público</span>
          <h1 className="lumina-headline mt-4 text-slate-100">
            Consulta tu deuda paso a paso, sin perderte en el catálogo
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Empieza por la empresa, confirma el servicio correcto y luego
            ingresa la referencia exacta del cliente. El flujo mantiene la
            misma lógica actual, pero ahora te guía con mayor claridad.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
          <div className="lumina-inline-stat">
            <FiGrid className="text-cyan-300" /> Empresas disponibles:{" "}
            {totalCompanies}
          </div>
          <div className="lumina-inline-stat">
            <FiShield className="text-cyan-300" /> Servicios publicados:{" "}
            {totalServices}
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-3xl">
        <label className="lumina-label mb-2 block text-slate-300">
          Buscar empresa o servicio
        </label>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ej: electricidad, agua, universidad..."
            className="lumina-input pl-11"
          />
        </div>
        <div className="mt-4 rounded-[20px] border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">
          <p className="font-medium">Qué sigue</p>
          <p className="mt-1 text-cyan-100/80">
            {guidance?.description ||
              "Selecciona una empresa para continuar con la consulta guiada."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
