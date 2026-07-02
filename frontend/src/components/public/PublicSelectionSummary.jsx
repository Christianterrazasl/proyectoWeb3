const summaryItems = [
  { key: "company", label: "Empresa" },
  { key: "service", label: "Servicio" },
  { key: "reference", label: "Referencia" },
];
const PublicSelectionSummary = ({ companyName, serviceName, reference }) => {
  const values = {
    company: companyName || "Pendiente",
    service: serviceName || "Pendiente",
    reference: reference || "Pendiente",
  };

  return (
    <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <p className="lumina-label text-cyan-300">Resumen de tu selección</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.key} className="lumina-metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-100">
              {values[item.key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicSelectionSummary;
