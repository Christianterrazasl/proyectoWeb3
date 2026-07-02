import {
  AiOutlineLoading3Quarters,
} from "react-icons/ai";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiInfo,
} from "react-icons/fi";

const VARIANT_STYLES = {
  loading: {
    icon: AiOutlineLoading3Quarters,
    iconClassName: "animate-spin text-cyan-300",
    containerClassName: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  },
  error: {
    icon: FiAlertCircle,
    iconClassName: "text-rose-300",
    containerClassName: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  },
  success: {
    icon: FiCheckCircle,
    iconClassName: "text-emerald-300",
    containerClassName:
      "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  },
  empty: {
    icon: FiInbox,
    iconClassName: "text-slate-300",
    containerClassName: "border-white/10 bg-white/[0.04] text-slate-100",
  },
  info: {
    icon: FiInfo,
    iconClassName: "text-cyan-300",
    containerClassName: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  },
};

const PublicState = ({ variant = "info", title, description }) => {
  const state = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = state.icon;

  return (
    <article className="lumina-shell flex min-h-[220px] items-center justify-center">
      <div
        className={`w-full rounded-[24px] border px-6 py-8 text-center shadow-[0_20px_80px_rgba(15,23,42,0.2)] ${state.containerClassName}`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-slate-950/35 text-2xl">
          <Icon className={state.iconClassName} />
        </div>

        <h3 className="mt-5 text-xl font-semibold text-slate-100">{title}</h3>

        {description ? (
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
    </article>
  );
};

export default PublicState;
