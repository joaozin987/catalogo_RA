import { mount } from "@vue/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import ArView from "../src/views/ArView.vue";

const product = { id: "classico", name: "Clássico", price: "R$ 29,90", glb: "/static/burger.glb" };
let wrapper;
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); });

it("configura ambos os marcadores e atualiza o status ao perder/encontrar marcador", async () => {
  vi.stubGlobal("isSecureContext", true);
  wrapper = mount(ArView, { props: { product } });
  expect(wrapper.findAll("a-marker")).toHaveLength(2);
  expect(wrapper.find(".product-model").attributes("gltf-model")).toBe(product.glb);
  await wrapper.find("a-marker").trigger("markerFound");
  expect(wrapper.find("#ar-status").element.hidden).toBe(true);
  await wrapper.find("a-marker").trigger("markerLost");
  expect(wrapper.find("#ar-status").element.hidden).toBe(false);
});
it("exibe erro de câmera e de modelo sem ocultar após encontrar marcador", async () => {
  vi.stubGlobal("isSecureContext", true);
  wrapper = mount(ArView, { props: { product } });
  await wrapper.find(".product-model").trigger("model-error");
  expect(wrapper.find("#ar-status").text()).toContain("modelo 3D");
  await wrapper.find("a-marker").trigger("markerFound");
  expect(wrapper.find("#ar-status").element.hidden).toBe(false);
  await wrapper.find("a-scene").trigger("camera-error");
  expect(wrapper.find("#ar-status").text()).toContain("câmera");
});
it("interrompe vídeo e cena ao desmontar", () => {
  vi.stubGlobal("isSecureContext", true);
  wrapper = mount(ArView, { props: { product } });
  const stop = vi.fn();
  const scene = wrapper.find("a-scene").element;
  scene.pause = vi.fn();
  const video = document.createElement("video");
  video.srcObject = { getTracks: () => [{ stop }] };
  scene.systems = { arjs: { _arSession: { arSource: { domElement: video } } } };
  wrapper.unmount(); wrapper = undefined;
  expect(stop).toHaveBeenCalled();
  expect(scene.pause).toHaveBeenCalled();
});
