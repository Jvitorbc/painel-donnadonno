import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLoja } from "../context/LojaContext";
import { paraSlug } from "../lib/texto";

export default function Categorias() {
  const { loja } = useLoja();
  const [categorias, setCategorias] = useState([]);
  const [nomeNovo, setNomeNovo] = useState("");
  const [edicao, setEdicao] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!loja) return;
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nome, slug")
      .eq("loja_id", loja.id)
      .order("nome");
    if (error) setErro(error.message);
    setCategorias(data || []);
  }, [loja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(evento) {
    evento.preventDefault();
    const nome = nomeNovo.trim();
    if (!nome) return;
    const { error } = await supabase.from("categorias").insert({ loja_id: loja.id, nome, slug: paraSlug(nome) });
    if (error) {
      setErro(error.message);
      return;
    }
    setNomeNovo("");
    carregar();
  }

  async function salvarEdicao() {
    const { error } = await supabase
      .from("categorias")
      .update({ nome: edicao.nome, slug: paraSlug(edicao.nome) })
      .eq("id", edicao.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setEdicao(null);
    carregar();
  }

  async function excluir(categoria) {
    if (!confirm(`Excluir a categoria "${categoria.nome}"? Produtos dela ficam sem categoria definida.`)) return;
    const { error } = await supabase.from("categorias").delete().eq("id", categoria.id);
    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }
    carregar();
  }

  return (
    <div className="pagina pagina--estreita">
      <h1>Categorias</h1>
      <p className="pagina__intro">
        Hoje o catálogo só usa "Vestidos" — mas se a loja passar a vender outros tipos de peça, é aqui que se cadastra.
      </p>
      {erro && <p className="mensagem-erro">{erro}</p>}

      <ul className="lista-simples">
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            {edicao?.id === categoria.id ? (
              <>
                <input value={edicao.nome} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} />
                <button type="button" className="botao botao--linha" onClick={salvarEdicao}>
                  Salvar
                </button>
                <button type="button" className="botao botao--linha" onClick={() => setEdicao(null)}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span>{categoria.nome}</span>
                <button
                  type="button"
                  className="botao botao--linha"
                  onClick={() => setEdicao({ id: categoria.id, nome: categoria.nome })}
                >
                  Editar
                </button>
                <button type="button" className="botao botao--linha botao--perigo" onClick={() => excluir(categoria)}>
                  Excluir
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form className="formulario-linha" onSubmit={adicionar}>
        <input
          placeholder="Nome da nova categoria"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
          aria-label="Nome da nova categoria"
        />
        <button type="submit" className="botao botao--primario">
          + Adicionar categoria
        </button>
      </form>
    </div>
  );
}
