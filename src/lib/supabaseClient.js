import { createClient } from "@supabase/supabase-js";

// Lidas do arquivo .env.local (desenvolvimento) ou das variáveis de
// ambiente configuradas na Vercel (produção) — nunca ficam escritas
// direto no código.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const LOJA_SLUG = import.meta.env.VITE_LOJA_SLUG;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !LOJA_SLUG) {
  throw new Error(
    "Faltam variáveis de ambiente do Supabase. Confira o arquivo .env.local (veja .env.example)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
