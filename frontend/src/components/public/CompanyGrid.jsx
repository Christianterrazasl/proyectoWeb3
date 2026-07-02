import { FiArrowRight, FiLayers } from "react-icons/fi";

const CompanyGrid = ({ companies, onSelectCompany }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {companies.map((company) => (
        <button
          key={company.id}
          type="button"
          className="lumina-interactive-card flex h-full cursor-pointer flex-col text-left"
          onClick={() => onSelectCompany(company)}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="lumina-chip">{company.category || "Servicios"}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-100">
                {company.name}
              </h3>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
              <FiArrowRight />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-cyan-300">
            <FiLayers />
            <span>{company.services?.length || 0} servicio(s)</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CompanyGrid;
