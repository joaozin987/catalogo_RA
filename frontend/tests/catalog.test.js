import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import CatalogView from "../src/views/CatalogView.vue";
import { fetchProducts, selectProduct } from "../src/catalog.js";

const products = [
  { id: "classico", name: "Clássico", category: "Hambúrgueres", price: "R$ 29,90", desc: "Descrição", glb: "/static/burger.glb" },
  { id: "suco", name: "Suco", category: "Bebidas", price: "R$ 5,00", desc: "Laranja", image: "/static/suco.png" },
];
afterEach(() => { vi.unstubAllGlobals(); });

describe("catálogo e API", () => {
  it("carrega a API sem cache e propaga erros HTTP", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => products });
    expect(await fetchProducts(fetch)).toEqual(products);
    expect(fetch).toHaveBeenCalledWith("/api/products", { cache: "no-store" });
    await expect(fetchProducts(async () => ({ ok: false, status: 503 }))).rejects.toThrow("503");
  });
  it("rejeita catálogo inválido e vazio sem iniciar visualização", async () => {
    for (const data of [{}, [], [{ id: "invalido" }]]) {
      await expect(fetchProducts(async () => ({ ok: true, json: async () => data }))).rejects.toThrow();
    }
  });
  it("mantém o primeiro produto para ID ausente ou desconhecido", () => {
    expect(selectProduct(products, "suco")).toBe(products[1]);
    expect(selectProduct(products, "nao-existe")).toBe(products[0]);
    expect(selectProduct(products, null)).toBe(products[0]);
    expect(selectProduct([], "x")).toBeUndefined();
  });
});

describe("interface do catálogo", () => {
  it("filtra categorias sem alterar os produtos", async () => {
    const wrapper = mount(CatalogView, { props: { products } });
    expect(wrapper.findAll(".grid .card")).toHaveLength(2);
    const button = wrapper.findAll(".chip").find((item) => item.text() === "Bebidas");
    await button.trigger("click");
    expect(wrapper.findAll(".grid .card")).toHaveLength(1);
    expect(wrapper.find(".grid").text()).toContain("Suco");
    wrapper.unmount();
  });
  it("abre o produto com links para câmera e marcador e fecha o diálogo", async () => {
    vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function () { this.open = true; });
    vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function () { this.open = false; });
    const wrapper = mount(CatalogView, { props: { products } });
    await wrapper.find(".grid .card").trigger("click");
    expect(wrapper.find("dialog").element.open).toBe(true);
    expect(wrapper.find("#product-name").text()).toBe("Clássico");
    expect(wrapper.find("#camera-link").attributes("href")).toBe("/camera?id=classico");
    expect(wrapper.find("#marker-link").attributes("href")).toBe("/ar?id=classico");
    expect(wrapper.find("model-viewer").attributes("src")).toBe(products[0].glb);
    await wrapper.find(".sheet-close").trigger("click");
    expect(wrapper.find("dialog").element.open).toBe(false);
    wrapper.unmount();
  });
  it("usa foto sem modelo e apresenta erro de carregamento 3D", async () => {
    const wrapper = mount(CatalogView, { props: { products } });
    await wrapper.findAll(".grid .card")[1].trigger("click");
    expect(wrapper.find("#stage-img").attributes("src")).toBe(products[1].image);
    expect(wrapper.find("model-viewer").exists()).toBe(false);
    await wrapper.findAll(".grid .card")[0].trigger("click");
    await wrapper.find("model-viewer").trigger("error");
    expect(wrapper.find("[role=alert]").text()).toContain("Não foi possível");
    wrapper.unmount();
  });
});
