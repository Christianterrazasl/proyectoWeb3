import React from "react";
import { Link } from "react-router-dom";
import PublicCatalogBrowser from "../components/public/PublicCatalogBrowser.jsx";
import PublicFlowSteps from "../components/public/PublicFlowSteps.jsx";
import PublicSelectedCompanyFlow from "../components/public/PublicSelectedCompanyFlow.jsx";
import usePublicCatalogFlow from "../hooks/usePublicCatalogFlow.js";

const HomePage = () => {
  const { catalogView, selectionView, lookupView, actions } =
    usePublicCatalogFlow();

  const { selectedCompany, currentFlowStep } = selectionView;

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-100px] top-1/4 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PublicFlowSteps currentStep={currentFlowStep} />
          <Link to="/login" className="lumina-button-secondary w-full sm:w-auto">
            Acceso negocios
          </Link>
        </div>

        {!selectedCompany ? (
          <PublicCatalogBrowser
            catalogView={catalogView}
            onSelectCompany={actions.handleSelectCompany}
          />
        ) : (
          <PublicSelectedCompanyFlow
            selectionView={selectionView}
            lookupView={lookupView}
            onBack={actions.handleBack}
            onSelectService={actions.handleSelectService}
            onCustomerRefChange={actions.handleCustomerRefChange}
            onSearch={actions.handleSearch}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
