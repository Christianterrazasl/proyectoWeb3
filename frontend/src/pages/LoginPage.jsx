import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const LoginPage = () => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError("Completa usuario y contraseña");
      return;
    }

    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/proveedor");
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-primary text-white flex flex-col">
      <section className="py-4 px-8 bg-neutral text-black">
        <h1 className="text-[20px] font-semibold">MultiPagos</h1>
      </section>
      <section className="flex-1 flex items-center justify-center py-16 px-8">
        {loading ? (
          <div className="flex items-center justify-center h-[300px] w-full">
            <AiOutlineLoading3Quarters className="text-5xl text-white animate-spin" />
          </div>
        ) : (
          <div className="bg-neutral text-black rounded-3xl py-8 px-10 w-full max-w-[480px] shadow-md">
            <h2 className="text-[32px] font-semibold mb-4">Iniciar sesión</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-md font-semibold text-gray-500 mb-2 block">
                  Usuario
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingrese su usuario"
                  className="w-full p-2 border-[1px] border-gray-400 rounded-sm"
                />
              </div>
              <div className="">
                <label className="text-md font-semibold text-gray-500 mb-2 block">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="w-full p-2 border-[1px] border-gray-400 rounded-sm"
                />
              </div>
              {error && (
                <p className="text-[14px] text-red-600">{error}</p>
              )}
              <button
                type="submit"
                className="bg-primary text-white px-4 py-3 rounded-xl cursor-pointer font-semibold mt-4"
              >
                Ingresar
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};

export default LoginPage;
