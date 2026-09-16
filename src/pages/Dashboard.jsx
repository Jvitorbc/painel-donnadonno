import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useLoja } from "../context/LojaContext";

export default function Dashboard() {
  const { loja } = useLoja();
  const [numeros, setNumeros] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!loja) return;
    async function carregar() {
      const [{ count: total }, { count: ativos }, { count: novidades }] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("loja_id", loja.id),
        supabase
          .from("produtos")
          .select("id", { count: "exact", head: true })
          .eq("loja_id", loja.id)
          .eq("ativo", true),
        supabase
          .from("produtos")
          .select("id", { count: "exact", head: true })
          .eq("loja_id", loja.id)
          .eq("novidade", true)
      ]);
      setNumeros({ total: total ?? 0, ativos: ativos ?? 0, novidades: novidades ?? 0 });
      setCarregando(false);
    }
    carregar();
  }, [loja]);

  return (
    <div className="pagina">
      <span className="pagina__olho">Painel</span>
      <h1>Visão geral</h1>
      <p className="pagina__intro">Resumo rápido do catálogo da {loja?.nome}.</p>

      {carregando ? (
        <p>Carregando…</p>
      ) : (
        <div className="faixa-estatisticas">
          <div className="faixa-estatisticas__item">
            <span className="faixa-estatisticas__valor">{numeros.total}</span>
            <span className="faixa-estatisticas__rotulo">Peças cadastradas</span>
          </div>
          <div className="faixa-estatisticas__item">
            <span className="faixa-estatisticas__valor">{numeros.ativos}</span>
            <span className="faixa-estatisticas__rotulo">Ativas no catálogo</span>
          </div>
          <div className="faixa-estatisticas__item">
            <span className="faixa-estatisticas__valor">{numeros.total - numeros.ativos}</span>
            <span className="faixa-estatisticas__rotulo">Indisponíveis</span>
          </div>
          <div className="faixa-estatisticas__item">
            <span className="faixa-estatisticas__valor">{numeros.novidades}</span>
            <span className="faixa-estatisticas__rotulo">Marcadas como novidade</span>
          </div>
        </div>
      )}

      <div className="acoes-rapidas">
        <Link to="/produtos/novo" className="botao botao--primario">
          + Adicionar peça
        </Link>
        <Link to="/produtos" className="botao botao--secundario">
          Ver todos os produtos
        </Link>
      </div>
    </div>
  );
}
