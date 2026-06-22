import React, { useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiArrowRight, FiCreditCard, FiShield, FiZap } from "react-icons/fi";
import { searchProvidersByDocument } from "../services/deudasApi";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedCustomerRef, setSearchedCustomerRef] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const latestSearchRequestRef = useRef(0);

  const navigate = useNavigate();

  const handleSearch = async () => {
    const normalizedCustomerRef = searchQuery.trim();

    if (normalizedCustomerRef.length < 1) {
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    setSearchedCustomerRef(normalizedCustomerRef);

    const currentSearchRequest = latestSearchRequestRef.current + 1;
    latestSearchRequestRef.current = currentSearchRequest;

    try {
      const results = await searchProvidersByDocument(normalizedCustomerRef);

      if (latestSearchRequestRef.current !== currentSearchRequest) {
        return;
      }

      setSearchResults(results);
    } catch (err) {
      if (latestSearchRequestRef.current !== currentSearchRequest) {
        return;
      }

      setSearchResults([]);
      setError(err.message || "No se pudo completar la búsqueda");
    } finally {
      if (latestSearchRequestRef.current === currentSearchRequest) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-100px] top-1/4 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-cyan-300/8 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="lumina-shell">
          <div className="">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-3 rounded-full border border-cyan-300/20 bg-slate-950/55 px-4 py-2 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      MultiPagos
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      Acceso público
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lumina-card rounded-[28px] border border-white/10 bg-slate-950/65 p-5 shadow-[0_30px_120px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[24px] font-bold text-cyan-300">Buscar deudas</p>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="home-search"
                  className="lumina-label mb-2 block text-slate-300"
                >
                  Documento o código de cliente
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="home-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    type="text"
                    placeholder="Ej: 1234567 o COD-001"
                    className="lumina-input"
                  />

                  <button
                    type="button"
                    className="lumina-button-primary min-w-[152px] cursor-pointer"
                    onClick={handleSearch}
                  >
                    <FaSearch className="text-sm" />
                    Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 flex-1">
          <div className="lumina-shell min-h-[420px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-slate-300">Resultados</p>
                <h2 className="text-[24px] font-bold text-slate-100">
                  Proveedores disponibles
                </h2>
              </div>
              {hasSearched && !loading && !error && (
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {searchResults.length} resultado(s)
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <AiOutlineLoading3Quarters className="text-5xl animate-spin text-cyan-300" />
              </div>
            ) : error ? (
              <div className="mt-6 flex min-h-[320px] items-center justify-center">
                <div className="w-full max-w-2xl rounded-[24px] border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-center text-rose-200">
                  {error}
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {searchResults.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className="lumina-interactive-card cursor-pointer text-left"
                    onClick={() =>
                      navigate(
                        `/deuda/${provider.idProveedor}?customerRef=${encodeURIComponent(
                          searchedCustomerRef,
                        )}`,
                      )
                    }
                  >
                    <div className="overflow-hidden rounded-[18px] border border-white/8 bg-slate-950/70">
                      <div className="h-[220px] w-full overflow-hidden">
                        <img
                          src={provider.image}
                          alt={provider.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="lumina-label text-cyan-300">Proveedor</p>
                        <h3 className="mt-3 text-xl font-semibold text-slate-100">
                          {provider.name}
                        </h3>
                      </div>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/8 p-2 text-cyan-200">
                        <FiArrowRight />
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {provider.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="mt-6 flex min-h-[320px] items-center justify-center text-center">
                <div className="max-w-xl rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-8">
                  <p className="text-lg font-semibold text-slate-100">
                    Sin coincidencias
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    No se encontraron deudas para el número de documento
                    ingresado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex min-h-[320px] items-center justify-center text-center">
                <div className="max-w-xl rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-8">
                  <p className="text-lg font-semibold text-slate-100">
                    Tu búsqueda empieza aquí
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Ingresa tu CI/NIT o código de cliente para ver tus deudas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
