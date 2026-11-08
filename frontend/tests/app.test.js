import { mount } from "@vue/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import App from "../src/App.vue";

vi.mock("../src/libraries.js", () => ({ loadLibraries: vi.fn().mockResolvedValue() }));
const settle = async () => { await new Promise((resolve) => setTimeout(resolve, 0)); };
afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, "", "/"); });
it("mostra falha de API e permite tentar novamente", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  const wrapper = mount(App);
  await settle();
  expect(wrapper.find("[role=alert]").text()).toContain("503");
  await wrapper.find("button").trigger("click");
  await settle();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(wrapper.find("video").exists()).toBe(false);
  wrapper.unmount();
});
it("renderiza catálogo recebido do Django", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [
    { id: "classico", name: "Clássico", category: "Hambúrgueres", desc: "Descrição", price: "R$ 29,90" },
  ] }));
  const wrapper = mount(App);
  await settle();
  expect(wrapper.find(".grid").text()).toContain("Clássico");
  expect(wrapper.find("[role=alert]").exists()).toBe(false);
  wrapper.unmount();
});

it("compara a imagem enviada com o GLB sem consultar o catálogo", async () => {
  window.history.replaceState({}, "", "/laboratorio-3d");
  vi.spyOn(document, "cookie", "get").mockReturnValue("csrftoken=test-token");
  const original = new Blob(["photo"], { type: "image/png" });
  const model = new Blob(["model"], { type: "model/gltf-binary" });
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn().mockReturnValueOnce("blob:original").mockReturnValueOnce("blob:model"),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ ok: true, blob: async () => original })
    .mockResolvedValueOnce({ ok: true, blob: async () => model }));
  const wrapper = mount(App);
  await wrapper.get("[data-sample]").trigger("click");
  await settle();
  expect(wrapper.get("img").attributes("src")).toBe("blob:original");
  await wrapper.get("form").trigger("submit");
  await settle();
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    "/static/images/classico-recorte.png", "/api/laboratorio-3d/reconstruir",
  ]);
  expect(fetch.mock.calls[1][1]).toMatchObject({
    body: original,
    headers: { "Content-Type": "image/png", "X-CSRFToken": "test-token" },
  });
  expect(wrapper.get("model-viewer").attributes("src")).toBe("blob:model");
  wrapper.unmount();
  expect(URL.revokeObjectURL.mock.calls.flat()).toEqual(["blob:original", "blob:model"]);
});
