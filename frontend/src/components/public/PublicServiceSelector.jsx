const PublicServiceSelector = ({
  companyName,
  services,
  selectedServiceId,
  onSelectService,
}) => {
  return (
    <article className="lumina-shell">
      <h3 className="lumina-title text-slate-100">Servicios</h3>

      <div className="mt-6 flex flex-col gap-3">
        {services.map((service) => {
          const selected = selectedServiceId === service.id;

          return (
            <button
              key={service.id}
              type="button"
              className={`lumina-interactive-card cursor-pointer text-left ${
                selected ? "is-active" : ""
              }`}
              onClick={() => onSelectService(service.id)}
              aria-pressed={selected}
            >
              <p className="lumina-label text-cyan-300">{companyName}</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-100">
                {service.name}
              </h4>
            </button>
          );
        })}
      </div>
    </article>
  );
};

export default PublicServiceSelector;
