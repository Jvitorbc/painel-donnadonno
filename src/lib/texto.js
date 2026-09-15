/** Transforma um nome em "slug" (usado na URL do catálogo, ex: ?marca=kalandra). */
export function paraSlug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
