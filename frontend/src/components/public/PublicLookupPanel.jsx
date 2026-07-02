import { FaSearch } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const PublicLookupPanel = ({
  inputLabel,
  inputType,
  customerRef,
  inputPlaceholder,
  onCustomerRefChange,
  onSubmit,
  selectedServiceEnabled,
  canSearch,
  loadingSearch,
}) => {
  return (
    <article className="lumina-shell">
      <h3 className="lumina-title text-slate-100">Consulta</h3>

      <form onSubmit={onSubmit} className="mt-6 max-w-2xl">
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
      </form>
    </article>
  );
};

export default PublicLookupPanel;
