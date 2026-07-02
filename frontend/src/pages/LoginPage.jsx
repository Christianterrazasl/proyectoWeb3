import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { loginRequest, getMeRequest } from "../services/authApi";
import { useAuth } from "../context/useAuth";
import { getDefaultRouteForUser, getUserGlobalRole } from "../utils/roleRouting";

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

      const token = await loginRequest({ email, password });
      const meData = await getMeRequest(token.access);
      const globalRole = getUserGlobalRole(meData);

      if (globalRole === "user") {
        setError("El pago público no requiere cuenta. Usa tu documento en el inicio.");
        return;
      }

      login({
        access: token.access,
        refresh: token.refresh,
        me: meData,
      });

      navigate(getDefaultRouteForUser(meData), { replace: true });
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
        <div className="absolute right-[-120px] top-1/4 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-8">
        <section className="lumina-shell">
          <h1 className="lumina-headline text-slate-100">Acceso negocios</h1>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="lumina-label mb-2 block text-slate-300">
                Correo
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

            {error ? (
              <div
                aria-live="polite"
                className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="lumina-button-primary w-full cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin text-base" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>

            <Link to="/" className="lumina-button-secondary text-center">
              Volver al inicio
            </Link>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
