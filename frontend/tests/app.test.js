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
