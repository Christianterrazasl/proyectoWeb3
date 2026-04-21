import { Routes, Route } from "react-router-dom";
import Home from "./pages/index.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
