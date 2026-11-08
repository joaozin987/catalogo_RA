export async function fetchProducts(fetcher = fetch) {
  const response = await fetcher("/api/products", { cache: "no-store" });
  if (!response.ok) throw new Error(`Não foi possível carregar o catálogo (${response.status}).`);
  const products = await response.json();
  const fields = ["id", "name", "category", "desc", "price"];
  if (!Array.isArray(products) || !products.length || products.some((product) =>
    !product || fields.some((field) => typeof product[field] !== "string" || !product[field].trim()))) {
    throw new Error("Catálogo inválido ou vazio.");
  }
  return products;
}

export function selectProduct(products, id) {
  return products.find((product) => product.id === id) || products[0];
}
