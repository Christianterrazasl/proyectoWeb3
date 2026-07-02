import { FaArrowLeft } from "react-icons/fa";
import PublicLookupPanel from "./PublicLookupPanel.jsx";
import PublicSearchResults from "./PublicSearchResults.jsx";
import PublicSelectedCompanyHero from "./PublicSelectedCompanyHero.jsx";
import PublicServiceSelector from "./PublicServiceSelector.jsx";

const PublicSelectedCompanyFlow = ({
  selectionView,
  lookupView,
  onBack,
  onSelectService,
  onCustomerRefChange,
  onSearch,
}) => {
  const { selectedCompany, selectedService, selectedServiceId } = selectionView;
  const {
    customerRef,
    normalizedCustomerRef,
    canSearch,
    loadingSearch,
    hasSearched,
    lookupError,
    lookupNotice,
    debts,
    paymentRoute,
    inputLabel,
    inputType,
    inputPlaceholder,
  } = lookupView;

  if (!selectedCompany) {
    return null;
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="lumina-shell">
        <button
          onClick={onBack}
          className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          <FaArrowLeft /> Volver
        </button>

        <PublicSelectedCompanyHero
          category={selectedCompany.category}
          companyName={selectedCompany.name}
          servicesCount={selectedCompany.services.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PublicServiceSelector
          companyName={selectedCompany.name}
          services={selectedCompany.services}
          selectedServiceId={selectedServiceId}
          onSelectService={onSelectService}
        />

        <PublicLookupPanel
          inputLabel={inputLabel}
          inputType={inputType}
          customerRef={customerRef}
          inputPlaceholder={inputPlaceholder}
          onCustomerRefChange={onCustomerRefChange}
          onSubmit={onSearch}
          selectedServiceEnabled={Boolean(selectedService)}
          canSearch={canSearch}
          loadingSearch={loadingSearch}
        />
      </div>

      <PublicSearchResults
        hasSearched={hasSearched}
        loadingSearch={loadingSearch}
        lookupError={lookupError}
        lookupNotice={lookupNotice}
        debts={debts}
        paymentRoute={paymentRoute}
        selectedServiceName={selectedService?.name}
        companyName={selectedCompany.name}
        customerRef={normalizedCustomerRef}
      />
    </section>
  );
};

export default PublicSelectedCompanyFlow;
