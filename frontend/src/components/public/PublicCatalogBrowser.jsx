import HeroSearch from "./HeroSearch.jsx";
import CompanyCategoryTabs from "./CompanyCategoryTabs.jsx";
import CompanyGrid from "./CompanyGrid.jsx";
import PublicState from "./PublicState.jsx";
import {
  buildPublicCatalogBrowserState,
  buildPublicCatalogGuidance,
} from "./publicFlowViewModels.js";

const PublicCatalogBrowser = ({ catalogView, onSelectCompany }) => {
  const {
    searchTerm,
    setSearchTerm,
    totalCompanies,
    totalServices,
    categories,
    activeCategory,
    setActiveCategory,
    filteredCompanies,
    loadingCatalog,
    catalogError,
  } = catalogView;

  const browserState = buildPublicCatalogBrowserState({
    loadingCatalog,
    catalogError,
    filteredCompanies,
  });

  const catalogGuidance = buildPublicCatalogGuidance({
    totalCompanies,
    totalServices,
    filteredCompanies,
    activeCategory,
    searchTerm,
  });

  return (
    <section className="flex flex-1 flex-col gap-6">
      <HeroSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCompanies={totalCompanies}
        totalServices={totalServices}
        guidance={catalogGuidance}
      />

      <section className="lumina-shell flex-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="lumina-label text-cyan-300">Empresas disponibles</p>
            <h2 className="lumina-title mt-3 text-slate-100">
              {catalogGuidance.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {catalogGuidance.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm text-slate-400 md:items-end">
            <span>{catalogGuidance.matchCountLabel}</span>
            <div className="flex flex-wrap gap-2">
              {catalogGuidance.badges.map((badge) => (
                <span key={badge} className="lumina-chip">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <CompanyCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className="mt-6">
          {browserState.contentState ? (
            <PublicState {...browserState.contentState} />
          ) : (
            <CompanyGrid
              companies={filteredCompanies}
              onSelectCompany={onSelectCompany}
            />
          )}
        </div>
      </section>
    </section>
  );
};

export default PublicCatalogBrowser;
