import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoja } from "../context/LojaContext";

const ITENS_NAV = [
  { para: "/", rotulo: "Início", fim: true },
  { para: "/produtos", rotulo: "Produtos" },
  { para: "/marcas", rotulo: "Marcas" },
  { para: "/categorias", rotulo: "Categorias" }
];

/** Menu lateral fixo no desktop; no celular vira uma barra no topo com um
 *  botão de hambúrguer que abre/fecha a navegação (em vez de precisar
 *  arrastar os links pro lado). */
export default function BarraLateral() {
  const { sair, usuario } = useAuth();
  const { loja } = useLoja();
  const navegar = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  async function aoSair() {
    await sair();
    navegar("/login", { replace: true });
  }

  return (
    <aside className="barra-lateral">
      <div className="barra-lateral__topo">
        <div className="barra-lateral__marca">
          <img src="/logo.svg" alt="" className="barra-lateral__logo" />
          <div>
            <strong>{loja?.nome || "Painel"}</strong>
            <span>Administrativo</span>
          </div>
        </div>
        <button
          type="button"
          className={`barra-lateral__hamburguer${menuAberto ? " barra-lateral__hamburguer--aberto" : ""}`}
          onClick={() => setMenuAberto((atual) => !atual)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav className={`barra-lateral__nav${menuAberto ? " barra-lateral__nav--aberto" : ""}`}>
        {ITENS_NAV.map((item) => (
          <NavLink key={item.para} to={item.para} end={item.fim} onClick={() => setMenuAberto(false)}>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="barra-lateral__rodape">
        <span title={usuario?.email}>{usuario?.email}</span>
        <button type="button" onClick={aoSair} className="botao botao--linha">
          Sair
        </button>
      </div>
    </aside>
  );
}
