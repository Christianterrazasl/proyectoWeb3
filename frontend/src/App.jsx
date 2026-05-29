import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import DeudasPage from "./pages/DeudasPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProveedorPage from "./pages/ProveedorPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/deuda/:idProveedor" element={<DeudasPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/proveedor" element={<ProveedorPage />} />
    </Routes>
  );
}
