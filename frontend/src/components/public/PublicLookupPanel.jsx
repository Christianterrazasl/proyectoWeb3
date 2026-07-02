import { FaSearch } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PublicSelectionSummary from "./PublicSelectionSummary.jsx";
import { buildPublicLookupPanelModel } from "./publicFlowViewModels.js";

const PublicLookupPanel = ({
  inputLabel,
  inputType,
  customerRef,
  inputPlaceholder,
  onCustomerRefChange,
  onSubmit,
  selectedServiceName,
  selectedServiceEnabled,
  canSearch,
  loadingSearch,
  companyName,
  normalizedCustomerRef,
}) => {
  const lookupModel = buildPublicLookupPanelModel({
    selectedServiceName,
    inputLabel,
    normalizedCustomerRef,
    canSearch,
    selectedServiceEnabled,
  });

  return (
    <article className="lumina-shell">
      <p className="lumina-label text-cyan-300">Consulta pública</p>
      <h3 className="lumina-title mt-3 text-slate-100">
        Confirma la referencia antes de buscar
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
        {selectedServiceName
          ? `Servicio seleccionado: ${selectedServiceName}`
          : "Selecciona un servicio para habilitar la consulta."}
      </p>
      <div
        className={`mt-5 rounded-[20px] border px-4 py-3 text-sm ${
          lookupModel.statusTone === "ready"
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
            : lookupModel.statusTone === "disabled"
              ? "border-white/8 bg-white/[0.03] text-slate-300"
              : "border-amber-400/25 bg-amber-500/10 text-amber-100"
        }`}
      >
        <p className="font-semibold">Estado de la consulta</p>
        <p className="mt-1">{lookupModel.readinessLabel}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-2xl">
        <label className="lumina-label mb-2 block text-slate-300">
          {inputLabel}
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <input
            type={inputType}
            value={customerRef}
            onChange={onCustomerRefChange}
            placeholder={inputPlaceholder}
            className="lumina-input min-w-0 flex-1"
            required
            disabled={!selectedServiceEnabled}
          />
          <button
            type="submit"
            className="lumina-button-primary w-full cursor-pointer sm:min-w-[152px] sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loadingSearch || !canSearch}
          >
            {loadingSearch ? (
              <AiOutlineLoading3Quarters className="mx-auto animate-spin" />
            ) : (
              <>
                <FaSearch /> Buscar
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {lookupModel.helperText}
        </p>
      </form>

      <PublicSelectionSummary
        companyName={companyName}
        serviceName={selectedServiceName}
        reference={normalizedCustomerRef}
      />
    </article>
  );
};

export default PublicLookupPanel;
