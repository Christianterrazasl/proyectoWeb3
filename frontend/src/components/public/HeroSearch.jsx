import { FiSearch } from "react-icons/fi";

const HeroSearch = ({ searchTerm, onSearchChange }) => {
  return (
    <section className="lumina-shell">
      <h1 className="lumina-headline text-slate-100">Consulta y paga tus deudas</h1>

      <div className="mt-6 max-w-2xl">
        <label className="lumina-label mb-2 block text-slate-300">
          Buscar empresa
        </label>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Empresa o servicio"
            className="lumina-input pl-11"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
