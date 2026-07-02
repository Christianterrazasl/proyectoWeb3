import React from "react";
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
        <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-cyan-300/8 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="mb-6">
          <div className="flex items-center gap-3 rounded-full border border-cyan-300/20 bg-slate-950/55 px-4 py-2 w-max shadow-[0_0_30px_rgba(34,211,238,0.08)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-300">
              P
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Portal Público
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                Consulta y pago
              </p>
            </div>
          </div>
          <div className="mb-6">
            <PublicFlowSteps currentStep={currentFlowStep} />
          </div>
        </section>

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