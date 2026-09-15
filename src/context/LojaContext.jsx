import { createContext, useContext, useEffect, useState } from "react";
import { supabase, LOJA_SLUG } from "../lib/supabaseClient";

const LojaContext = createContext(null);

/**
 * Busca, uma única vez, os dados da loja que este painel administra
 * (definida pela variável VITE_LOJA_SLUG). Um painel novo para outro
 * cliente aponta pra outra loja só trocando essa variável — nada de
 * código muda.
 */
export function LojaProvider({ children }) {
  const [loja, setLoja] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .from("lojas")
      .select("id, nome, whatsapp, slug")
      .eq("slug", LOJA_SLUG)
      .single()
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        setLoja(data);
        setCarregando(false);
      });
  }, []);

  return <LojaContext.Provider value={{ loja, erro, carregando }}>{children}</LojaContext.Provider>;
}

export function useLoja() {
  return useContext(LojaContext);
}
