import { buildPublicServiceOptions } from "./publicFlowViewModels.js";

const PublicServiceSelector = ({
  companyName,
  services,
  selectedServiceId,
  onSelectService,
}) => {
  const serviceOptions = buildPublicServiceOptions({
    companyName,
    services,
    selectedServiceId,
  });

  return (
    <article className="lumina-shell">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="lumina-label text-cyan-300">Servicios disponibles</p>
          <h3 className="lumina-title mt-3 text-slate-100">
            Elige el servicio a consultar
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Cuando el servicio quede marcado como seleccionado, el siguiente paso
            será ingresar la referencia exacta del cliente.
          </p>
        </div>
        <span className="lumina-chip">
          {serviceOptions.length} item(s)
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {serviceOptions.map((service) => (
          <button
            key={service.id}
            type="button"
            className={`lumina-interactive-card cursor-pointer text-left ${
              service.selected ? "is-active" : ""
            }`}
            onClick={() => onSelectService(service.id)}
            aria-pressed={service.selected}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="lumina-label text-cyan-300">{service.companyName}</p>
              <span
                className={`w-max rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  service.selected
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : "border border-white/8 bg-white/[0.03] text-slate-400"
                }`}
              >
                {service.statusLabel}
              </span>
            </div>
            <h4 className="mt-3 text-lg font-semibold text-slate-100">
              {service.name}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{service.description}</p>
            <p
              className={`mt-4 text-sm font-medium leading-6 ${
                service.selected ? "text-emerald-200" : "text-cyan-300"
              }`}
            >
              {service.nextStepLabel}
            </p>
          </button>
        ))}
      </div>
    </article>
  );
};

export default PublicServiceSelector;
