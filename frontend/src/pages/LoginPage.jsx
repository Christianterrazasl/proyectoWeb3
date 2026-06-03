import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { loginRequest, getMeRequest } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Completa email y contraseña");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const data = await loginRequest({ email, password });

      const userData = await getMeRequest(data.access);

      login({ access: data.access, refresh: data.refresh, user: userData });

      navigate("/proveedor");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lumina-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-120px] top-1/4 h-64 w-64 rounded-full bg-cyan-400/6 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 bg-cyan-300/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <main className="flex flex-1 items-center justify-center">
          <section className="w-full max-w-5xl">
            <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-full border border-cyan-300/20 bg-slate-950/55 px-4 py-2 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.15)]">
                M
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-100">MultiPagos</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Lumina Direct</p>
              </div>
              <div className="hidden h-5 w-px bg-slate-700/80 sm:block" />
              <p className="hidden text-[11px] uppercase tracking-[0.18em] text-cyan-300 sm:block">
                Entorno protegido · Acceso seguro
              </p>
            </div>

            <section className="lumina-card relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 p-4 shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-6 lg:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6 sm:p-7 lg:p-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                    Sesión protegida
                  </div>

                  <div className="mt-6 max-w-lg">
                    <p className="lumina-label text-cyan-300">Acceso premium</p>
                    <h1 className="lumina-headline mt-4 text-slate-100">
                      Entra al panel con una experiencia más precisa, privada y elegante.
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                      Gestiona operaciones y pagos desde un entorno diseñado para transmitir control, seguridad y confianza.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/50 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Operación</p>
                      <p className="mt-2 text-sm text-slate-300">Panel unificado para tu gestión diaria.</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/50 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Monitoreo</p>
                      <p className="mt-2 text-sm text-slate-300">Consulta movimientos con lectura clara y segura.</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/50 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Acceso público</p>
                      <p className="mt-2 text-sm text-slate-300">El flujo sin cuenta sigue disponible para pagar servicios.</p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <span className="lumina-trust-badge">SSL Secure</span>
                    <span className="lumina-trust-badge">AES-256</span>
                    <span className="lumina-trust-badge">Monitoreo continuo</span>
                  </div>
                </div>

                <section className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-7">
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                      <p className="lumina-label text-cyan-300">Iniciar sesión</p>
                      <h2 className="lumina-title mt-3 text-slate-100">Accede a tu panel</h2>
                      <p className="mt-2 text-sm text-slate-400">Ingresa para continuar con tu operación.</p>
                    </div>
                    <div className="hidden rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200 sm:block">
                      Premium login
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                      <label htmlFor="email" className="lumina-label mb-2 block text-slate-300">
                        Correo electrónico
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@empresa.com"
                        className="lumina-input"
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="lumina-label mb-2 block text-slate-300">
                        Contraseña
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="lumina-input"
                        disabled={loading}
                        autoComplete="current-password"
                      />
                    </div>

                    {error && (
                      <div
                        aria-live="polite"
                        className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="lumina-button-primary mt-2 w-full cursor-pointer"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <AiOutlineLoading3Quarters className="animate-spin text-base" />
                          Validando acceso...
                        </>
                      ) : (
                        "Ingresar"
                      )}
                    </button>

                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-slate-700/70" />
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">o</span>
                      <div className="h-px flex-1 bg-slate-700/70" />
                    </div>

                    <button
                      type="button"
                      className="lumina-button-secondary w-full cursor-pointer"
                      onClick={() => navigate("/")}
                      disabled={loading}
                    >
                      Pagar sin cuenta
                    </button>

                    <div className="mt-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                      Acceso cifrado para proveedores y administración.
                    </div>
                  </form>
                </section>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
