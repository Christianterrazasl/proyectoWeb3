import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPublicCatalogServices,
  searchDebtsLookup,
} from "../services/deudasApi";
import {
  buildCompanyDirectory,
  buildLookupFieldConfig,
  buildPublicPaymentRoute,
  deriveCompanyCategories,
  filterCompaniesByCategoryAndQuery,
  findCompanyById,
  findServiceById,
  PUBLIC_ALL_CATEGORIES,
} from "../utils/publicCatalogFlow";

export function usePublicCatalogFlow() {
  const [catalogServices, setCatalogServices] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(PUBLIC_ALL_CATEGORIES);
  const [customerRef, setCustomerRef] = useState("");
  const [debts, setDebts] = useState([]);

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupNotice, setLookupNotice] = useState("");

  const companies = useMemo(
    () => buildCompanyDirectory(catalogServices),
    [catalogServices],
  );

  const categories = useMemo(
    () => deriveCompanyCategories(companies),
    [companies],
  );

  const filteredCompanies = useMemo(
    () =>
      filterCompaniesByCategoryAndQuery({
        companies,
        activeCategory,
        searchTerm,
      }),
    [activeCategory, companies, searchTerm],
  );

  const selectedCompany = useMemo(
    () => findCompanyById(companies, selectedCompanyId),
    [companies, selectedCompanyId],
  );

  const selectedService = useMemo(
    () => findServiceById(selectedCompany, selectedServiceId),
    [selectedCompany, selectedServiceId],
  );

  const normalizedCustomerRef = customerRef.trim();

  const paymentRoute = useMemo(
    () =>
      buildPublicPaymentRoute({
        selectedService,
        customerRef: normalizedCustomerRef,
      }),
    [normalizedCustomerRef, selectedService],
  );

  const lookupFieldConfig = useMemo(
    () => buildLookupFieldConfig(selectedService),
    [selectedService],
  );

  const currentFlowStep = selectedCompany ? (hasSearched ? 3 : 2) : 1;
  const canSearch = Boolean(selectedService && normalizedCustomerRef);

  const resetLookupState = useCallback(() => {
    setDebts([]);
    setHasSearched(false);
    setLookupError("");
    setLookupNotice("");
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const services = await getPublicCatalogServices();
        setCatalogServices(services);
      } catch (err) {
        setCatalogError(err.message || "Error al cargar el catálogo.");
      } finally {
        setLoadingCatalog(false);
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setSelectedServiceId("");
      return;
    }

    const serviceStillExists = selectedCompany.services.some(
      (service) => service.id === selectedServiceId,
    );

    if (!serviceStillExists) {
      setSelectedServiceId(selectedCompany.services[0]?.id || "");
    }
  }, [selectedCompany, selectedServiceId]);

  const handleSelectCompany = useCallback(
    (company) => {
      setSelectedCompanyId(company.id);
      setCustomerRef("");
      setSelectedServiceId(company.services[0]?.id || "");
      resetLookupState();
    },
    [resetLookupState],
  );

  const handleBack = useCallback(() => {
    setSelectedCompanyId(null);
    setSelectedServiceId("");
    setCustomerRef("");
    resetLookupState();
  }, [resetLookupState]);

  const handleSelectService = useCallback(
    (serviceId) => {
      setSelectedServiceId(serviceId);
      setCustomerRef("");
      resetLookupState();
    },
    [resetLookupState],
  );

  const handleCustomerRefChange = useCallback(
    (event) => {
      setCustomerRef(event.target.value);

      if (hasSearched || lookupError || lookupNotice || debts.length) {
        resetLookupState();
      }
    },
    [debts.length, hasSearched, lookupError, lookupNotice, resetLookupState],
  );

  const handleSearch = useCallback(
    async (event) => {
      event?.preventDefault();

      if (!normalizedCustomerRef || !selectedService) {
        return;
      }

      setLoadingSearch(true);
      setLookupError("");
      setLookupNotice("");
      setHasSearched(true);
      setDebts([]);

      try {
        const results = await searchDebtsLookup(
          String(selectedService.companyId ?? selectedCompany?.id ?? ""),
          selectedService.id,
          normalizedCustomerRef,
        );
        setDebts(results);
      } catch (err) {
        if (err?.status === 404) {
          setLookupNotice(err.message || "No tienes deudas pendientes");
        } else {
          setLookupError(err.message || "Error en la búsqueda.");
        }
      } finally {
        setLoadingSearch(false);
      }
    },
    [normalizedCustomerRef, selectedCompany?.id, selectedService],
  );

  return {
    catalogView: {
      searchTerm,
      setSearchTerm,
      totalCompanies: companies.length,
      totalServices: catalogServices.length,
      categories,
      activeCategory,
      setActiveCategory,
      filteredCompanies,
      loadingCatalog,
      catalogError,
    },
    selectionView: {
      selectedCompany,
      selectedService,
      selectedServiceId,
      currentFlowStep,
    },
    lookupView: {
      customerRef,
      normalizedCustomerRef,
      canSearch,
      loadingSearch,
      hasSearched,
      lookupError,
      lookupNotice,
      debts,
      paymentRoute,
      ...lookupFieldConfig,
    },
    actions: {
      handleSelectCompany,
      handleBack,
      handleSelectService,
      handleCustomerRefChange,
      handleSearch,
    },
  };
}

export default usePublicCatalogFlow;
