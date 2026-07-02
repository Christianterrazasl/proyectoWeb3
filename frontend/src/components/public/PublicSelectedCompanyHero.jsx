import { FiBriefcase, FiLayers } from "react-icons/fi";

const PublicSelectedCompanyHero = ({ category, companyName, servicesCount }) => {
  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="lumina-label text-cyan-300">{category || "Empresa"}</p>
        <h2 className="lumina-headline mt-3 text-slate-100">{companyName}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
        <div className="lumina-inline-stat">
          <FiBriefcase className="text-cyan-300" /> {companyName}
        </div>
        <div className="lumina-inline-stat">
          <FiLayers className="text-cyan-300" /> {servicesCount} servicio(s)
        </div>
      </div>
    </div>
  );
};

export default PublicSelectedCompanyHero;
