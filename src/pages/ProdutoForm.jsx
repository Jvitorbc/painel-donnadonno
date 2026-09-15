import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useLoja } from "../context/LojaContext";

const TAMANHOS_POSSIVEIS = ["PP", "P", "M", "G", "GG"];

/** Cria um "caminho de arquivo" seguro (sem espaço/acento) para o Storage. */
function nomeArquivoSeguro(nomeOriginal) {
  const carimbo = Date.now();
  const limpo = nomeOriginal
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-]/g, "-");
  return `${carimbo}-${limpo}`;
}

export default function ProdutoForm() {
  const { loja } = useLoja();
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();

  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fotos, setFotos] = useState([]); // linhas da tabela produto_fotos
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [enviandoVideo, setEnviandoVideo] = useState(false);
  const [erro, setErro] = useState("");

  const [campos, setCampos] = useState({
    nome: "",
    marca_id: "",
    categoria_id: "",
    preco: "",
    descricao: "",
    tamanhos: [],
    cores: "",
    video_url: "",
    ativo: true,
    novidade: false
  });

  useEffect(() => {
    if (!loja) return;
    async function carregarListas() {
      const [{ data: dadosMarcas }, { data: dadosCategorias }] = await Promise.all([
        supabase.from("marcas").select("id, nome").eq("loja_id", loja.id).order("nome"),
        supabase.from("categorias").select("id, nome").eq("loja_id", loja.id).order("nome")
      ]);
      setMarcas(dadosMarcas || []);
      setCategorias(dadosCategorias || []);
    }
    carregarListas();
  }, [loja]);

  useEffect(() => {
    if (!editando || !loja) return;
    async function carregarProduto() {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, produto_fotos(id, url, ordem)")
        .eq("id", id)
        .single();
      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }
      setCampos({
        nome: data.nome || "",
        marca_id: data.marca_id || "",
        categoria_id: data.categoria_id || "",
        preco: data.preco ?? "",
        descricao: data.descricao || "",
        tamanhos: data.tamanhos || [],
        cores: (data.cores || []).join(", "),
        video_url: data.video_url || "",
        ativo: data.ativo,
        novidade: data.novidade
      });
      setFotos([...(data.produto_fotos || [])].sort((a, b) => a.ordem - b.ordem));
      setCarregando(false);
    }
    carregarProduto();
  }, [editando, id, loja]);

  function alternarTamanho(tamanho) {
    setCampos((atual) => ({
      ...atual,
      tamanhos: atual.tamanhos.includes(tamanho)
        ? atual.tamanhos.filter((t) => t !== tamanho)
        : [...atual.tamanhos, tamanho]
    }));
  }

  async function aoSalvar(evento) {
    evento.preventDefault();
    setErro("");
    setSalvando(true);

    const payload = {
      loja_id: loja.id,
      nome: campos.nome.trim(),
      marca_id: campos.marca_id || null,
      categoria_id: campos.categoria_id || null,
      preco: campos.preco === "" ? null : Number(campos.preco),
      descricao: campos.descricao.trim(),
      tamanhos: campos.tamanhos,
      cores: campos.cores
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      video_url: campos.video_url.trim() || null,
      ativo: campos.ativo,
      novidade: campos.novidade
    };

    if (editando) {
      const { error } = await supabase.from("produtos").update(payload).eq("id", id);
      setSalvando(false);
      if (error) {
        setErro(error.message);
        return;
      }
      navegar("/produtos");
    } else {
      const { data, error } = await supabase.from("produtos").insert(payload).select("id").single();
      setSalvando(false);
      if (error) {
        setErro(error.message);
        return;
      }
      // Depois de criado, manda pra tela de edição — é lá que dá pra
      // adicionar as fotos (precisa do id do produto, que só existe agora).
      navegar(`/produtos/${data.id}/editar`, { replace: true });
    }
  }

  async function aoEscolherFotos(evento) {
    const arquivos = Array.from(evento.target.files || []);
    if (arquivos.length === 0) return;
    setEnviandoFoto(true);
    setErro("");

    let proximaOrdem = fotos.length ? Math.max(...fotos.map((f) => f.ordem)) + 1 : 0;
    for (const arquivo of arquivos) {
      const caminho = `${loja.id}/${id}/${nomeArquivoSeguro(arquivo.name)}`;
      const { error: erroUpload } = await supabase.storage.from("produtos").upload(caminho, arquivo);
      if (erroUpload) {
        setErro(`Erro ao enviar "${arquivo.name}": ${erroUpload.message}`);
        continue;
      }
      const {
        data: { publicUrl }
      } = supabase.storage.from("produtos").getPublicUrl(caminho);

      const { data: novaFoto, error: erroInsercao } = await supabase
        .from("produto_fotos")
        .insert({ produto_id: id, url: publicUrl, ordem: proximaOrdem })
        .select("id, url, ordem")
        .single();
      if (!erroInsercao) {
        setFotos((atual) => [...atual, novaFoto]);
        proximaOrdem += 1;
      }
    }
    setEnviandoFoto(false);
    evento.target.value = "";
  }

  async function removerFoto(foto) {
    if (!confirm("Remover esta foto?")) return;
    const { error } = await supabase.from("produto_fotos").delete().eq("id", foto.id);
    if (error) {
      alert("Não foi possível remover: " + error.message);
      return;
    }
    setFotos((atual) => atual.filter((f) => f.id !== foto.id));
  }

  async function moverFoto(foto, direcao) {
    const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem);
    const posicao = ordenadas.findIndex((f) => f.id === foto.id);
    const alvo = direcao === "cima" ? posicao - 1 : posicao + 1;
    if (alvo < 0 || alvo >= ordenadas.length) return;

    const outra = ordenadas[alvo];
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("produto_fotos").update({ ordem: outra.ordem }).eq("id", foto.id),
      supabase.from("produto_fotos").update({ ordem: foto.ordem }).eq("id", outra.id)
    ]);
    if (e1 || e2) {
      alert("Não foi possível reordenar.");
      return;
    }
    setFotos((atual) =>
      atual.map((f) => {
        if (f.id === foto.id) return { ...f, ordem: outra.ordem };
        if (f.id === outra.id) return { ...f, ordem: foto.ordem };
        return f;
      })
    );
  }

  async function aoEscolherVideo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setEnviandoVideo(true);
    setErro("");
    const caminho = `${loja.id}/${id}/${nomeArquivoSeguro(arquivo.name)}`;
    const { error } = await supabase.storage.from("produtos").upload(caminho, arquivo);
    setEnviandoVideo(false);
    if (error) {
      setErro("Erro ao enviar vídeo: " + error.message);
      return;
    }
    const {
      data: { publicUrl }
    } = supabase.storage.from("produtos").getPublicUrl(caminho);
    setCampos((atual) => ({ ...atual, video_url: publicUrl }));
    evento.target.value = "";
  }

  if (carregando) return <p className="pagina">Carregando…</p>;

  return (
    <div className="pagina pagina--estreita">
      <div className="pagina__cabecalho">
        <h1>{editando ? "Editar peça" : "Adicionar peça"}</h1>
        <Link to="/produtos" className="botao botao--linha">
          Voltar
        </Link>
      </div>

      <form className="formulario-produto" onSubmit={aoSalvar}>
        <label htmlFor="nome">Nome da peça</label>
        <input
          id="nome"
          required
          value={campos.nome}
          onChange={(e) => setCampos({ ...campos, nome: e.target.value })}
        />

        <div className="formulario-produto__linha">
          <div>
            <label htmlFor="marca">Marca</label>
            <select
              id="marca"
              value={campos.marca_id}
              onChange={(e) => setCampos({ ...campos, marca_id: e.target.value })}
            >
              <option value="">Selecione…</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoria">Categoria</label>
            <select
              id="categoria"
              value={campos.categoria_id}
              onChange={(e) => setCampos({ ...campos, categoria_id: e.target.value })}
            >
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label htmlFor="preco">Preço (R$)</label>
        <input
          id="preco"
          type="number"
          step="0.01"
          min="0"
          value={campos.preco}
          onChange={(e) => setCampos({ ...campos, preco: e.target.value })}
        />

        <label htmlFor="descricao">Descrição</label>
        <textarea
          id="descricao"
          rows={4}
          value={campos.descricao}
          onChange={(e) => setCampos({ ...campos, descricao: e.target.value })}
        />

        <span className="rotulo-grupo">Tamanhos disponíveis</span>
        <div className="grupo-checkboxes">
          {TAMANHOS_POSSIVEIS.map((tamanho) => (
            <label key={tamanho} className="checkbox-pilula">
              <input
                type="checkbox"
                checked={campos.tamanhos.includes(tamanho)}
                onChange={() => alternarTamanho(tamanho)}
              />
              {tamanho}
            </label>
          ))}
        </div>

        <label htmlFor="cores">Cores disponíveis (separadas por vírgula)</label>
        <input
          id="cores"
          placeholder="Preto, Terracota, Branco"
          value={campos.cores}
          onChange={(e) => setCampos({ ...campos, cores: e.target.value })}
        />

        <div className="formulario-produto__linha">
          <label className="checkbox-linha">
            <input
              type="checkbox"
              checked={campos.ativo}
              onChange={(e) => setCampos({ ...campos, ativo: e.target.checked })}
            />
            Ativo no catálogo
          </label>
          <label className="checkbox-linha">
            <input
              type="checkbox"
              checked={campos.novidade}
              onChange={(e) => setCampos({ ...campos, novidade: e.target.checked })}
            />
            Marcar como novidade
          </label>
        </div>

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao botao--primario" disabled={salvando}>
          {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Salvar e continuar"}
        </button>
        {!editando && (
          <p className="dica-formulario">
            Depois de salvar, esta página recarrega no modo de edição — é aí que você adiciona as fotos e o vídeo.
          </p>
        )}
      </form>

      {editando && (
        <>
          <section className="secao-midia">
            <h2>Fotos</h2>
            <p className="pagina__intro">A primeira foto da lista é a que aparece como capa no catálogo.</p>
            <div className="grade-fotos">
              {fotos.map((foto, indice) => (
                <div className="miniatura-foto" key={foto.id}>
                  <img src={foto.url} alt="" />
                  {indice === 0 && <span className="miniatura-foto__principal">Capa</span>}
                  <div className="miniatura-foto__acoes">
                    <button type="button" onClick={() => moverFoto(foto, "cima")} disabled={indice === 0} aria-label="Mover para cima">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moverFoto(foto, "baixo")}
                      disabled={indice === fotos.length - 1}
                      aria-label="Mover para baixo"
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => removerFoto(foto)} aria-label="Remover foto">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <label className="botao botao--secundario botao--upload">
              {enviandoFoto ? "Enviando…" : "+ Adicionar fotos"}
              <input type="file" accept="image/*" multiple hidden onChange={aoEscolherFotos} disabled={enviandoFoto} />
            </label>
          </section>

          <section className="secao-midia">
            <h2>Vídeo da modelo</h2>
            {campos.video_url ? (
              <video src={campos.video_url} controls className="video-preview" />
            ) : (
              <p className="pagina__intro">Nenhum vídeo enviado ainda.</p>
            )}
            <label className="botao botao--secundario botao--upload">
              {enviandoVideo ? "Enviando…" : campos.video_url ? "Trocar vídeo" : "+ Adicionar vídeo"}
              <input type="file" accept="video/*" hidden onChange={aoEscolherVideo} disabled={enviandoVideo} />
            </label>
            <p className="dica-formulario">
              O vídeo só fica salvo na peça depois de clicar em "Salvar alterações" acima.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
