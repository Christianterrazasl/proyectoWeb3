import HeroSearch from "./HeroSearch.jsx";
import CompanyCategoryTabs from "./CompanyCategoryTabs.jsx";
import CompanyGrid from "./CompanyGrid.jsx";
import PublicState from "./PublicState.jsx";
import { buildPublicCatalogBrowserState } from "./publicFlowViewModels.js";

const PublicCatalogBrowser = ({ catalogView, onSelectCompany }) => {
  const {
    searchTerm,
    setSearchTerm,
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

  return (
    <section className="flex flex-1 flex-col gap-6">
      <HeroSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <section className="lumina-shell flex-1">
        <h2 className="lumina-title text-slate-100">Empresas</h2>

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
