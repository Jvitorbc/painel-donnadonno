import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useLoja } from "../context/LojaContext";

/** Data relativa simples ("hoje", "ontem", "há 5 dias") — sem biblioteca extra. */
function dataRelativa(isoString) {
  const dias = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

export default function Dashboard() {
  const { loja } = useLoja();
  const [numeros, setNumeros] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!loja) return;
    async function carregar() {
      const [{ count: total }, { count: ativos }, { count: novidades }, { data: listaProdutos }] = await Promise.all([
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
          .eq("novidade", true),
        supabase
          .from("produtos")
          .select("id, nome, criado_em, video_url, marcas(nome), produto_fotos(url)")
          .eq("loja_id", loja.id)
          .order("criado_em", { ascending: false })
      ]);
      setNumeros({ total: total ?? 0, ativos: ativos ?? 0, novidades: novidades ?? 0 });
      setProdutos(listaProdutos || []);
      setCarregando(false);
    }
    carregar();
  }, [loja]);

  const recentes = produtos.slice(0, 5);
  const pendencias = produtos.filter((p) => !p.produto_fotos?.length || !p.video_url);

  return (
    <div className="pagina">
      <span className="pagina__olho">Painel</span>
      <h1>Visão geral</h1>
      <p className="pagina__intro">Dashboard</p>

      {carregando ? (
        <p>Carregando…</p>
      ) : (
        <>
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

          <div className="acoes-rapidas">
            <Link to="/produtos/novo" className="botao botao--primario">
              + Adicionar peça
            </Link>
            <Link to="/produtos" className="botao botao--secundario">
              Ver todos os produtos
            </Link>
          </div>

          <div className="painel-dashboard-grade">
            <section className="secao-midia">
              <h2>Adicionadas recentemente</h2>
              {recentes.length === 0 ? (
                <p className="estado-vazio-simples">Nenhuma peça cadastrada ainda.</p>
              ) : (
                <ul className="lista-recentes">
                  {recentes.map((produto) => (
                    <li key={produto.id}>
                      <Link to={`/produtos/${produto.id}/editar`} className="lista-recentes__item">
                        <span className="lista-recentes__miniatura">
                          {produto.produto_fotos?.[0] ? (
                            <img src={produto.produto_fotos[0].url} alt="" />
                          ) : (
                            <span className="lista-recentes__sem-foto" aria-hidden="true" />
                          )}
                        </span>
                        <span className="lista-recentes__texto">
                          <strong>{produto.nome}</strong>
                          <small>{produto.marcas ? produto.marcas.nome : "Sem marca"}</small>
                        </span>
                        <span className="lista-recentes__data">{dataRelativa(produto.criado_em)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="secao-midia">
              <h2>Pendências</h2>
              {pendencias.length === 0 ? (
                <p className="estado-vazio-simples">Tudo certo — nenhuma peça sem foto ou vídeo.</p>
              ) : (
                <ul className="lista-recentes">
                  {pendencias.map((produto) => {
                    const semFoto = !produto.produto_fotos?.length;
                    const semVideo = !produto.video_url;
                    return (
                      <li key={produto.id}>
                        <Link to={`/produtos/${produto.id}/editar`} className="lista-recentes__item">
                          <span className="lista-recentes__texto">
                            <strong>{produto.nome}</strong>
                            <small>
                              {semFoto && semVideo
                                ? "Sem foto e sem vídeo"
                                : semFoto
                                ? "Sem foto"
                                : "Sem vídeo"}
                            </small>
                          </span>
                          <span className="tag-pendencia">Completar</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
