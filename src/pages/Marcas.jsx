import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLoja } from "../context/LojaContext";
import { paraSlug } from "../lib/texto";

export default function Marcas() {
  const { loja } = useLoja();
  const [marcas, setMarcas] = useState([]);
  const [nomeNovo, setNomeNovo] = useState("");
  const [edicao, setEdicao] = useState(null); // { id, nome } quando editando uma linha
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!loja) return;
    const { data, error } = await supabase.from("marcas").select("id, nome, slug").eq("loja_id", loja.id).order("nome");
    if (error) setErro(error.message);
    setMarcas(data || []);
  }, [loja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(evento) {
    evento.preventDefault();
    const nome = nomeNovo.trim();
    if (!nome) return;
    const { error } = await supabase.from("marcas").insert({ loja_id: loja.id, nome, slug: paraSlug(nome) });
    if (error) {
      setErro(error.message);
      return;
    }
    setNomeNovo("");
    carregar();
  }

  async function salvarEdicao() {
    const { error } = await supabase
      .from("marcas")
      .update({ nome: edicao.nome, slug: paraSlug(edicao.nome) })
      .eq("id", edicao.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setEdicao(null);
    carregar();
  }

  async function excluir(marca) {
    if (!confirm(`Excluir a marca "${marca.nome}"? Produtos dessa marca ficam sem marca definida.`)) return;
    const { error } = await supabase.from("marcas").delete().eq("id", marca.id);
    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }
    carregar();
  }

  return (
    <div className="pagina pagina--estreita">
      <h1>Marcas</h1>
      {erro && <p className="mensagem-erro">{erro}</p>}

      <ul className="lista-simples">
        {marcas.map((marca) => (
          <li key={marca.id}>
            {edicao?.id === marca.id ? (
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
                <span>{marca.nome}</span>
                <button type="button" className="botao botao--linha" onClick={() => setEdicao({ id: marca.id, nome: marca.nome })}>
                  Editar
                </button>
                <button type="button" className="botao botao--linha botao--perigo" onClick={() => excluir(marca)}>
                  Excluir
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form className="formulario-linha" onSubmit={adicionar}>
        <input
          placeholder="Nome da nova marca"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
          aria-label="Nome da nova marca"
        />
        <button type="submit" className="botao botao--primario">
          + Adicionar marca
        </button>
      </form>
    </div>
  );
}
