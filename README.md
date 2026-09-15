# Painel administrativo — Donna Donno

App separado do catálogo público (aquele em HTML/CSS/JS puro). Este aqui é
um app em **React**, feito para a dona da loja cadastrar/editar/excluir
peças sem mexer em código. Os dois se conectam pelo mesmo banco de dados
(Supabase): o que for salvo aqui aparece automaticamente no catálogo
público assim que ele também for ligado ao banco (esse é o próximo passo,
ainda não feito).

## Como rodar na sua máquina

1. Instale as dependências (só precisa fazer isso uma vez, ou quando este
   `package.json` mudar):
   ```
   npm install
   ```
2. Rode o servidor de desenvolvimento:
   ```
   npm run dev
   ```
3. Abra o endereço que aparecer no terminal (normalmente
   `http://localhost:5173`).

O arquivo `.env.local` já vem preenchido com os dados do projeto Supabase
`donna-donno` — não precisa mexer nele para rodar localmente.

## Login de teste

- **E-mail:** joaovitorbarros2000@gmail.com
- **Senha:** DonnaDonno#2026

Esse login já está cadastrado como administrador da loja Donna Donno no
banco de dados (tabela `administradores`). Depois, quando for entregar
pra cliente, criamos um login separado só para ela (ver seção
"Como criar um login para a cliente" abaixo).

## Estrutura do projeto

```
src/
  lib/
    supabaseClient.js   → conecta com o Supabase (usa as variáveis do .env)
    texto.js            → função para transformar nome em "slug" (ex: Kalandra → kalandra)
  context/
    AuthContext.jsx      → controla se tem alguém logado ou não
    LojaContext.jsx      → busca os dados da loja (Donna Donno) uma vez, no início
  components/
    RotaProtegida.jsx    → "porteiro": manda pro login quem não estiver logado
    Topbar.jsx            → barra do topo com menu e botão "Sair"
  pages/
    Login.jsx
    Dashboard.jsx         → tela inicial, com os números gerais
    Produtos.jsx           → lista de produtos
    ProdutoForm.jsx         → formulário de criar/editar produto (fotos e vídeo incluídos)
    Marcas.jsx
    Categorias.jsx
  App.jsx                 → define as URLs (rotas) do painel
  main.jsx                → ponto de entrada do app
```

## Publicando na Vercel (deixando o painel acessível pela internet)

1. Crie um repositório novo no GitHub para este projeto (do mesmo jeito
   que você já fez para o catálogo — `git init`, `git add`, `git commit`,
   criar o repositório no GitHub, `git push`).
2. Entre em [vercel.com](https://vercel.com) e faça login com sua conta
   do GitHub.
3. Clique em "Add New… → Project" e selecione o repositório que você
   acabou de criar.
4. A Vercel detecta sozinha que é um projeto Vite — não precisa mudar
   nada nas configurações de build.
5. Antes de clicar em "Deploy", abra a seção **Environment Variables** e
   adicione estas três (os mesmos valores que estão no `.env.local`):
   - `VITE_SUPABASE_URL` → `https://xkewjkjldtfzsvqvxgte.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → `sb_publishable_RokuarBTLwKnLiIKF4AM0g_MyQwgqrN`
   - `VITE_LOJA_SLUG` → `donna-donno`
6. Clique em "Deploy". Em cerca de 1 minuto a Vercel te dá um link
   (algo como `painel-donnadonno.vercel.app`) — é esse link que você (e,
   mais pra frente, a cliente) vai acessar para usar o painel.

## Como criar um login para a cliente (mais pra frente)

Quando o painel estiver pronto para ser entregue, é só criar mais um
usuário administrador para ela — me avisa quando chegar essa hora que eu
crio o login (e-mail/senha) dela ligado à loja Donna Donno, do mesmo jeito
que foi feito o seu.

## Sobre reaproveitar este painel para outro cliente

Este projeto foi estruturado para não precisar recomeçar do zero a cada
cliente novo. Ver explicação completa na conversa com o Claude — resumo:
o banco de dados já foi desenhado para guardar produtos "por loja"
(`loja_id` em cada tabela), então, dependendo do modelo de negócio
escolhido, um cliente novo pode:
(a) ganhar uma cópia deste mesmo projeto (outro projeto Supabase, outro
projeto Vercel, mudando só os dados de marca/loja), ou
(b) usar o MESMO painel/banco que já existe, sendo só mais uma "loja"
dentro dele — o que exigiria adaptar o login para perguntar/saber qual
loja cada administrador está gerenciando (hoje o painel sempre assume UMA
loja só, via `VITE_LOJA_SLUG`).
