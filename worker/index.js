// Worker do painel administrativo: serve os arquivos estáticos do painel (React)
// e, na rota /api/upload, recebe fotos/vídeos de produto e guarda no R2.

const SUPABASE_URL = "https://xkewjkjldtfzsvqvxgte.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZXdqa2psZHRmenN2cXZ4Z3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODQyMDEsImV4cCI6MjEwNTA2MDIwMX0.ui5myA4_WTq_hy6Fz9E6-wlpGLCjLUtOH2G-XJ-6OUI";
const R2_PUBLIC_URL = "https://pub-742877ba0c71466887ab312cc32bee8f.r2.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/upload" && request.method === "POST") {
      return tratarUpload(request, env);
    }

    // Qualquer outra rota: serve o painel (arquivos estáticos do build do Vite).
    return env.ASSETS.fetch(request);
  },
};

function respostaJson(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function tratarUpload(request, env) {
  const cabecalhoAuth = request.headers.get("Authorization") || "";
  const token = cabecalhoAuth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return respostaJson({ erro: "Não autenticado." }, 401);

  // 1) Confirma que o token pertence a um usuário logado de verdade no Supabase.
  const respUsuario = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!respUsuario.ok) return respostaJson({ erro: "Sessão inválida." }, 401);
  const usuario = await respUsuario.json();

  // 2) Confirma que esse usuário é administrador de alguma loja
  //    (a RLS da tabela só deixa ele ver a própria linha).
  const respAdmin = await fetch(
    `${SUPABASE_URL}/rest/v1/administradores?id=eq.${usuario.id}&select=loja_id`,
    { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY } }
  );
  const admins = respAdmin.ok ? await respAdmin.json() : [];
  if (!admins.length) return respostaJson({ erro: "Sem permissão." }, 403);
  const lojaId = admins[0].loja_id;

  // 3) Lê o arquivo enviado.
  let dadosForm;
  try {
    dadosForm = await request.formData();
  } catch {
    return respostaJson({ erro: "Envio inválido." }, 400);
  }
  const arquivo = dadosForm.get("arquivo");
  const caminho = dadosForm.get("caminho");
  if (!arquivo || typeof caminho !== "string") {
    return respostaJson({ erro: "Arquivo ou caminho ausente." }, 400);
  }
  // O caminho tem que começar com o id da loja desse admin — evita que
  // alguém suba arquivo numa pasta de outra loja.
  if (!caminho.startsWith(`${lojaId}/`)) {
    return respostaJson({ erro: "Caminho não pertence a esta loja." }, 403);
  }

  await env.PRODUTOS_BUCKET.put(caminho, arquivo.stream(), {
    httpMetadata: { contentType: arquivo.type || "application/octet-stream" },
  });

  return respostaJson({ url: `${R2_PUBLIC_URL}/${caminho}` });
}
