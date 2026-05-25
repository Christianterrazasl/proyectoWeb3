import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const deudasExample = [
  {
    id: 1,
    nombre: "Deuda 1",
    monto: 100,
    fecha: "2026-01-01",
  },
  {
    id: 2,
    nombre: "Deuda 2",
    monto: 200,
    fecha: "2026-01-02",
  },
];

const DeudasPage = () => {
  const { idProveedor } = useParams();
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeuda, setSelectedDeuda] = useState(null);

  const handlePago = () => {
    setSelectedDeuda(null);
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setDeudas(deudasExample);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="w-full h-screen bg-primary text-white flex flex-col">
      <section className="py-4 px-8 bg-neutral text-black bg-neutral">
        <h1 className="text-[20px] font-semibold">MultiPagos</h1>
      </section>
      <section className="w-full flex items-center justify-center h-full">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] w-full">
            <AiOutlineLoading3Quarters className="text-5xl text-white animate-spin" />
          </div>
        ) : deudas.length > 0 ? (
          <div className="max-w-[1400px] mx-auto w-full pt-4 pb-8 gap-[10%] px-8 bg-neutral min-h-[400px] text-black rounded-3xl flex">
            <div className="flex-1 flex-shrink-0">
              <h2 className="text-[32px] font-semibold mb-4">Deudas</h2>
              <div className="flex flex-col gap-4">
                {deudas.map((deuda) => (
                  <div
                    key={deuda.id}
                    className="flex items-center justify-between bg-gray-200 p-4 rounded-xl cursor-pointer"
                    style={{
                      backgroundColor:
                        selectedDeuda === deuda.id
                          ? "var(--color-primary)"
                          : "var(--color-gray-200)",
                      color:
                        selectedDeuda === deuda.id
                          ? "var(--color-white)"
                          : "var(--color-black)",
                    }}
                    onClick={() => setSelectedDeuda(deuda.id)}
                  >
                    <p>{deuda.nombre}</p>
                    <p>{deuda.monto} Bs.</p>
                    <p>{deuda.fecha}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex-shrink-0">
              <h2 className="text-[32px] font-semibold mb-4 text-end">Pago</h2>
              {selectedDeuda && <div className="flex flex-col gap-8 items-center justify-center">
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl" />
                <button
                  onClick={handlePago}
                  className="bg-primary text-white px-4 py-2 rounded-xl cursor-pointer"
                >
                  Ya pagué
                </button>
              </div>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] w-full">
            <p className="text-[20px] text-gray-500">
              No se encontraron deudas
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DeudasPage;
