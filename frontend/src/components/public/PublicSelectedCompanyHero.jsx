import { FiBriefcase, FiLayers } from "react-icons/fi";
import { buildSelectedCompanyHeroModel } from "./publicFlowViewModels.js";

const statIcons = {
  company: FiBriefcase,
  services: FiLayers,
};

const PublicSelectedCompanyHero = ({
  category,
  companyName,
  description,
  servicesCount,
}) => {
  const hero = buildSelectedCompanyHeroModel({
    category,
    companyName,
    description,
    servicesCount,
  });

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="lumina-label text-cyan-300">{hero.categoryLabel}</p>
        <h2 className="lumina-headline mt-3 text-slate-100">
          {hero.companyName}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          {hero.description}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[440px]">
        {hero.stats.map((stat) => {
          const Icon = statIcons[stat.key];

          return (
            <div key={stat.key} className="lumina-inline-stat">
              <Icon className="text-cyan-300" /> {stat.label}: {stat.value}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicSelectedCompanyHero;
