import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoja } from "../context/LojaContext";

export default function Topbar() {
  const { sair, usuario } = useAuth();
  const { loja } = useLoja();
  const navegar = useNavigate();

  async function aoSair() {
    await sair();
    navegar("/login", { replace: true });
  }

  return (
    <header className="barra-topo">
      <div className="barra-topo__marca">
        <strong>{loja?.nome || "Painel"}</strong>
        <span>Painel administrativo</span>
      </div>
      <nav className="barra-topo__nav">
        <NavLink to="/" end>
          Início
        </NavLink>
        <NavLink to="/produtos">Produtos</NavLink>
        <NavLink to="/marcas">Marcas</NavLink>
        <NavLink to="/categorias">Categorias</NavLink>
      </nav>
      <div className="barra-topo__usuario">
        <span title={usuario?.email}>{usuario?.email}</span>
        <button type="button" onClick={aoSair} className="botao botao--linha">
          Sair
        </button>
      </div>
    </header>
  );
}
