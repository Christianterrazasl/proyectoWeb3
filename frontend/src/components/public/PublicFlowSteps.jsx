import { FiCheckCircle, FiCircle } from "react-icons/fi";

const FLOW_STEPS = [
  { id: 1, title: "Empresa" },
  { id: 2, title: "Servicio" },
  { id: 3, title: "Pago" },
];

const PublicFlowSteps = ({ currentStep = 1 }) => {
  const normalizedStep = Number.isFinite(Number(currentStep))
    ? Number(currentStep)
    : 1;

  return (
    <div className="flex flex-wrap gap-2">
      {FLOW_STEPS.map((step) => {
        const isCompleted = normalizedStep > step.id;
        const isCurrent = normalizedStep === step.id;
        const Icon = isCompleted ? FiCheckCircle : FiCircle;

        return (
          <span
            key={step.id}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              isCompleted
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : isCurrent
                  ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}
          >
            <Icon className="text-base" />
            {step.title}
          </span>
        );
      })}
    </div>
  );
};

export default PublicFlowSteps;
