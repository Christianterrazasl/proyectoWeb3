import { FiCheckCircle, FiCircle, FiSearch, FiShield } from "react-icons/fi";

const FLOW_STEPS = [
  {
    id: 1,
    title: "Explora empresas",
    description: "Busca la empresa correcta dentro del catálogo público.",
    icon: FiSearch,
  },
  {
    id: 2,
    title: "Confirma servicio",
    description: "Elige el servicio e ingresa la referencia del cliente.",
    icon: FiCircle,
  },
  {
    id: 3,
    title: "Valida y paga",
    description: "Revisa deudas pendientes y continúa al pago QR.",
    icon: FiShield,
  },
];

const PublicFlowSteps = ({ currentStep = 1 }) => {
  const normalizedStep = Number.isFinite(Number(currentStep))
    ? Number(currentStep)
    : 1;
  const progressWidth = `${Math.max(
    0,
    ((Math.min(normalizedStep, FLOW_STEPS.length) - 1) /
      Math.max(FLOW_STEPS.length - 1, 1)) *
      100,
  )}%`;

  return (
    <div className="rounded-[28px] border border-cyan-300/15 bg-slate-950/45 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="relative hidden lg:block">
        <div className="absolute left-0 right-0 top-5 h-px bg-white/10" />
        <div
          className="absolute left-0 top-5 h-px bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400 transition-all duration-300"
          style={{ width: progressWidth }}
        />

        <div className="relative grid gap-4 lg:grid-cols-3">
          {FLOW_STEPS.map((step) => {
            const isCompleted = normalizedStep > step.id;
            const isCurrent = normalizedStep === step.id;
            const Icon = isCompleted ? FiCheckCircle : step.icon;

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base ${
                    isCompleted
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : isCurrent
                        ? "border-cyan-300/45 bg-cyan-400/15 text-cyan-200"
                        : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  <Icon />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Paso {step.id}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {FLOW_STEPS.map((step) => {
          const isCompleted = normalizedStep > step.id;
          const isCurrent = normalizedStep === step.id;
          const Icon = isCompleted ? FiCheckCircle : step.icon;

          return (
            <div
              key={step.id}
              className={`rounded-[20px] border px-4 py-4 ${
                isCompleted
                  ? "border-emerald-400/25 bg-emerald-500/10"
                  : isCurrent
                    ? "border-cyan-300/25 bg-cyan-500/10"
                    : "border-white/8 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    isCompleted
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : isCurrent
                        ? "border-cyan-300/45 bg-cyan-400/15 text-cyan-200"
                        : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  <Icon />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Paso {step.id}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicFlowSteps;
