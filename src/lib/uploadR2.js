import { supabase } from "./supabaseClient";

/** Envia um arquivo (foto ou vídeo) pro armazenamento (Cloudflare R2) através
 *  do próprio painel (rota /api/upload do Worker), e devolve a URL pública dele. */
export async function enviarArquivo(caminho, arquivo) {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Sessão expirada — faça login novamente.");

  const formData = new FormData();
  formData.append("arquivo", arquivo);
  formData.append("caminho", caminho);

  const resposta = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || "Falha ao enviar o arquivo.");
  }
  const { url } = await resposta.json();
  return url;
}
