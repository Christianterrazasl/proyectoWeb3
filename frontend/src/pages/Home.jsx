import React, { useEffect, useState } from "react";
import { FaSearch, FaArrowLeft, FaFileInvoiceDollar } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";
import {
  getPublicCatalogServices,
  searchDebtsLookup,
} from "../services/deudasApi";

const HomePage = () => {
  const [catalogServices, setCatalogServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [customerRef, setCustomerRef] = useState("");
  const [debts, setDebts] = useState([]);

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const services = await getPublicCatalogServices();
        setCatalogServices(services);
      } catch (err) {
        setError(err.message || "Error al cargar el catálogo.");
      } finally {
        setLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSelectService = (service) => {
    setSelectedService(service);
    setCustomerRef("");
    setDebts([]);
    setHasSearched(false);
    setError("");
  };

  const handleBack = () => {
    setSelectedService(null);
    setCustomerRef("");
    setDebts([]);
    setHasSearched(false);
    setError("");
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const normalizedRef = customerRef.trim();
    if (!normalizedRef || !selectedService) return;

    setLoadingSearch(true);
    setError("");
    setHasSearched(true);
    setDebts([]);

    try {
      const results = await searchDebtsLookup(
        selectedService.companyId,
        selectedService.id,
        normalizedRef,
      );
      setDebts(results);
    } catch (err) {
      setError(err.message || "Error en la búsqueda.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const inputSchema = selectedService?.inputSchema || {};
  const inputLabel =
    inputSchema.label || inputSchema.title || "Referencia del cliente";
  const inputType = inputSchema.type || "text";
  const inputPlaceholder =
    inputSchema.placeholder || `Ej: Ingrese su ${inputLabel.toLowerCase()}`;

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
              M
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">MultiPagos</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                Portal Público
              </p>
            </div>
          </div>
        </section>

        {!selectedService ? (
          <section className="lumina-shell flex-1">
            <div className="mb-6">
              <h2 className="text-[28px] font-bold text-slate-100">
                ¿Qué deseas pagar hoy?
              </h2>
              <p className="text-slate-400 mt-2">
                Selecciona un servicio disponible.
              </p>
            </div>

            {loadingCatalog ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <AiOutlineLoading3Quarters className="text-5xl animate-spin text-cyan-300" />
              </div>
            ) : error ? (
              <div className="rounded-[24px] border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-center text-rose-200">
                {error}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {catalogServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className="lumina-interactive-card cursor-pointer text-left h-full"
                    onClick={() => handleSelectService(service)}
                  >
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <div>
                        <p className="lumina-label text-cyan-300">
                          {service.companyName}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-slate-100">
                          {service.name}
                        </h3>
                      </div>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/8 p-2 text-cyan-200">
                        <FiArrowRight />
                      </span>
                    </div>
                    {service.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {service.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="flex-1 flex flex-col gap-6">
            <div className="lumina-shell">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 text-sm font-medium transition-colors cursor-pointer"
              >
                <FaArrowLeft /> Volver al catálogo
              </button>

              <h2 className="text-[24px] font-bold text-cyan-300">
                {selectedService.name}
              </h2>
              <p className="text-slate-400 mt-1">
                {selectedService.companyName}
              </p>

              <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
                <label className="lumina-label mb-2 block text-slate-300">
                  {inputLabel}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type={inputType}
                    value={customerRef}
                    onChange={(e) => setCustomerRef(e.target.value)}
                    placeholder={inputPlaceholder}
                    className="lumina-input"
                    required
                  />
                  <button
                    type="submit"
                    className="lumina-button-primary min-w-[152px] cursor-pointer"
                    disabled={loadingSearch}
                  >
                    {loadingSearch ? (
                      <AiOutlineLoading3Quarters className="animate-spin mx-auto" />
                    ) : (
                      <>
                        <FaSearch /> Buscar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {hasSearched && (
              <div className="lumina-shell flex-1">
                <h3 className="text-[20px] font-bold text-slate-100 mb-6">
                  Deudas Pendientes
                </h3>

                {loadingSearch ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <AiOutlineLoading3Quarters className="text-4xl animate-spin text-cyan-300" />
                  </div>
                ) : error ? (
                  <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 px-6 py-8 text-center text-cyan-100 flex flex-col items-center justify-center min-h-[200px]">
                    <FaCheckCircle className="text-4xl text-cyan-400 mb-3" />
                    <p className="text-lg font-semibold">{error}</p>
                    <p className="text-sm mt-2 text-cyan-300/80">
                      Estás al día con este servicio.
                    </p>
                  </div>
                ) : debts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {debts.map((debt, idx) => (
                      <div
                        key={debt.id || idx}
                        className="rounded-[20px] border border-white/10 bg-slate-900/60 p-5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl">
                            <FaFileInvoiceDollar />
                          </div>
                          <div>
                            <p className="text-slate-300 text-sm">
                              Periodo: {debt.period || "N/A"}
                            </p>
                            <p className="text-slate-100 font-bold text-lg mt-1">
                              Bs. {Number(debt.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-rose-500/20 text-rose-300 px-3 py-1 text-xs font-semibold uppercase tracking-wider border border-rose-500/30">
                          Pendiente
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

const FaCheckCircle = (props) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    {...props}
  >
    <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm113.522 178.683l-137.28 174.153a15.999 15.999 0 01-24.168 1.157l-78.077-78.077a16 16 0 010-22.627l22.627-22.627a16 16 0 0122.627 0l43.208 43.208 102.771-130.34a16 16 0 0124.62-1.782l21.89 21.89a16 16 0 011.782 24.615z"></path>
  </svg>
);

export default HomePage;
