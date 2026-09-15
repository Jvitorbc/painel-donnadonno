import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Envolve páginas que só administradores logados podem ver. */
export default function RotaProtegida({ children }) {
  const { sessao, carregando } = useAuth();

  if (carregando) return <div className="tela-carregando">Carregando…</div>;
  if (!sessao) return <Navigate to="/login" replace />;
  return children;
}
