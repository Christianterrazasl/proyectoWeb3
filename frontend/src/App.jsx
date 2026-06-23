import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import DeudasPage from "./pages/DeudasPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProveedorPage from "./pages/ProveedorPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/deuda/:idProveedor" element={<DeudasPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/proveedor" element={
        <ProtectedRoute requireProvider>
          <ProveedorPage />
        </ProtectedRoute>
      } />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
