import React from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const places = [
    {
        id: "1",
        name: "Pago de servicios públicos",
        description: "Pago de servicios públicos",
        image: "https://placehold.net/1.png",
    },
    {
        id: "2",
        name: "Pago de servicios públicos",
        description: "Pago de servicios públicos",
        image: "https://placehold.net/2.png",
    },
    {
        id: "3",
        name: "Pago de servicios públicos",
        description: "Pago de servicios públicos",
        image: "https://placehold.net/3.png",
    },
    {
        id: "4",
        name: "Pago de servicios públicos",
        description: "Pago de servicios públicos",
        image: "https://placehold.net/4.png",
    },
    {
        id: "5",
        name: "Pago de servicios públicos",
        description: "Pago de servicios públicos",
        image: "https://placehold.net/5.png",
    },
    {
        id: "6",
        name: "Pago de servicios públicos",
        description: "Pago de servicios públicos",
        image: "https://placehold.net/6.png",
    },
    
]

const HomePage = () => {
    const navigate = useNavigate();
  return (
    <div className="w-full h-screen bg-black text-white">
      <section className="py-4 px-8 bg-neutral text-black">
        <h1 className="text-[20px] font-semibold">MultiPagos</h1>
      </section>
      <section className="bg-primary py-16 text-center">
        <h1 className="text-[60px] font-semibold">Gestión Centralizada de Pagos</h1>
        <h2 className="text-[20px] text-gray-500 font-semibold mb-16">
          Acceda a tus pagos de forma sencilla y segura desde un solo lugar.
        </h2>
        <div className="bg-neutral py-2 px-3 rounded-sm w-[500px] mx-auto">
          <p className="text-sm font-semibold text-gray-500 mb-1 text-start">BUSCA POR NUMERO DE DOCUMENTO</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ingrese su numero de documento"
              className="w-full p-2 border-[1px] border-gray-400 text-black"
            />
            <button className="text-black p-2 cursor-pointer">
              <FaSearch className="text-gray-500" />
            </button>
          </div>
        </div>
      </section>
      <section className="bg-neutral py-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-4 gap-4">
            {places.map((place) => (
                <div key={place.id} className="bg-white p-4 rounded-sm shadow-md cursor-pointer">
                    <div className="w-full h-[200px] overflow-hidden rounded-sm">
                    <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-[20px] font-semibold">{place.name}</h3>
                    <p className="text-[16px] text-gray-500">{place.description}</p>
                </div>
            ))}
        </div>

      </section>
    </div>
  );
};

export default HomePage;
