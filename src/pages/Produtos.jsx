import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useLoja } from "../context/LojaContext";

export default function Produtos() {
  const { loja } = useLoja();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!loja) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, preco, ativo, novidade, marcas(nome), produto_fotos(url, ordem)")
      .eq("loja_id", loja.id)
      .order("ordem", { ascending: true });

    if (error) setErro(error.message);
    setProdutos(data || []);
    setCarregando(false);
  }, [loja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtivo(produto) {
    const { error } = await supabase.from("produtos").update({ ativo: !produto.ativo }).eq("id", produto.id);
    if (error) {
      alert("Não foi possível atualizar: " + error.message);
      return;
    }
    carregar();
  }

  async function excluir(produto) {
    if (!confirm(`Excluir "${produto.nome}" de vez? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("produtos").delete().eq("id", produto.id);
    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }
    carregar();
  }

  const filtrados = produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="pagina">
      <div className="pagina__cabecalho">
        <div>
          <span className="pagina__olho">Catálogo</span>
          <h1>Produtos</h1>
        </div>
        <Link to="/produtos/novo" className="botao botao--primario">
          + Adicionar peça
        </Link>
      </div>

      <input
        type="search"
        placeholder="Buscar pelo nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="campo-busca-lista"
        aria-label="Buscar produto pelo nome"
      />

      {erro && <p className="mensagem-erro">{erro}</p>}
      {carregando ? (
        <p>Carregando…</p>
      ) : filtrados.length === 0 ? (
        <div className="tabela-wrap">
          <p className="estado-vazio-simples">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th aria-hidden="true"></th>
                <th>Peça</th>
                <th className="th--numero">Preço</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((produto) => {
                const foto = [...(produto.produto_fotos || [])].sort((a, b) => a.ordem - b.ordem)[0];
                return (
                  <tr key={produto.id}>
                    <td>
                      {foto ? (
                        <img className="tabela__miniatura" src={foto.url} alt="" />
                      ) : (
                        <div className="tabela__sem-foto">Sem foto</div>
                      )}
                    </td>
                    <td className="tabela__produto">
                      <strong>{produto.nome}</strong>
                      <span>{produto.marcas?.nome || "Sem marca"}</span>
                    </td>
                    <td className="td--numero">R$ {Number(produto.preco).toFixed(2).replace(".", ",")}</td>
                    <td>
                      <div className="tabela__tags">
                        {produto.novidade && <span className="etiqueta etiqueta--novidade">Novidade</span>}
                        <span className={`etiqueta ${produto.ativo ? "etiqueta--ativo" : "etiqueta--inativo"}`}>
                          {produto.ativo ? "Ativo" : "Indisponível"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="tabela__acoes">
                        <button type="button" className="botao botao--linha" onClick={() => alternarAtivo(produto)}>
                          {produto.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <Link to={`/produtos/${produto.id}/editar`} className="botao botao--linha">
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="botao botao--linha botao--perigo"
                          onClick={() => excluir(produto)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
