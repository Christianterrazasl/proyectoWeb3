import React from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const deudas = [
  {
    id: "1",
    name: "Nur",
    description: "Pago de servicios",
    image: "https://placehold.net/1.png",
    idProveedor: "1",
  },
  {
    id: "2",
    name: "Saguapac",
    description: "Pago de servicios",
    image: "https://placehold.net/2.png",
    idProveedor: "2",
  },
  {
    id: "3",
    name: "Cre",
    description: "Pago de servicios",
    image: "https://placehold.net/3.png",
    idProveedor: "3",
  },
  {
    id: "4",
    name: "Colegio Marista",
    description: "Pago de servicios",
    image: "https://placehold.net/4.png",
    idProveedor: "4",
  },
  {
    id: "6",
    name: "Tigo",
    description: "Pago de servicios",
    image: "https://placehold.net/6.png",
    idProveedor: "6",
  },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (searchQuery.length < 1) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setSearchResults(deudas);
      setLoading(false);
    }, 2000);
  };

  const navigate = useNavigate();
  return (
    <div className="w-full h-screen bg-neutral text-white">
      <section className="py-4 px-8 bg-neutral text-black">
        <h1 className="text-[20px] font-semibold">MultiPagos</h1>
      </section>
      <section className="bg-primary py-16 text-center">
        <h1 className="text-[60px] font-semibold">
          Gestión Centralizada de Pagos
        </h1>
        <h2 className="text-[20px] text-gray-500 font-semibold mb-16">
          Accede a tus pagos de forma sencilla y segura desde un solo lugar.
        </h2>
        <div className="bg-neutral pb-4 py-3 px-4 rounded-lg w-[500px] mx-auto">
          <p className="text-md font-semibold text-gray-500 mb-4 text-start">
            Ingresa numero de documento
          </p>
          <div className="flex items-center gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Ingrese su numero de documento"
              className="w-full p-2 border-[1px] border-gray-400 text-black"
            />
            <button
              className="text-black p-2 cursor-pointer"
              onClick={handleSearch}
            >
              <FaSearch className="text-gray-500" />
            </button>
          </div>
        </div>
      </section>
      <section className="bg-neutral py-16">
        {!loading ? (
          <div className="flex items-center justify-center w-full">
            {searchResults.length > 0 ? (
              <div className="max-w-[1300px] mx-auto grid grid-cols-4 gap-4">
                {searchResults.map((deuda) => (
                  <div
                    key={deuda.id}
                    className="bg-white p-4 rounded-sm shadow-md cursor-pointer"
                    onClick={() => navigate(`/deuda/${deuda.idProveedor}`)}
                  >
                    <div className="w-full h-[200px] overflow-hidden rounded-sm">
                      <img
                        src={deuda.image}
                        alt={deuda.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-[20px] text-gray-900 font-semibold mt-4">
                      {deuda.name}
                    </h3>
                    <p className="text-[16px] text-gray-500">
                      {deuda.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] w-full text-center">
                <p className="text-[20px] text-gray-500">
                  No se encontraron deudas para el numero de documento ingresado
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] w-full ">
            <AiOutlineLoading3Quarters className="text-5xl text-gray-900 animate-spin" />
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
