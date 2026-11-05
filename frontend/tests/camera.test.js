import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CameraView from "../src/views/CameraView.vue";

const product = { id: "classico", name: "Clássico", price: "R$ 29,90", glb: "/static/burger.glb" };
let stop;
let stream;
let getUserMedia;
let wrapper;
const settle = async () => { await new Promise((resolve) => setTimeout(resolve, 0)); };
beforeEach(() => {
  stop = vi.fn();
  stream = { getTracks: () => [{ stop }] };
  getUserMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal("isSecureContext", true);
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.unstubAllGlobals(); });

it("solicita apenas vídeo e encerra a câmera ao desmontar", async () => {
  wrapper = mount(CameraView, { props: { product } });
  await settle();
  expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: "environment" } }, audio: false });
  expect(wrapper.find("video").element.srcObject).toBe(stream);
  wrapper.unmount(); wrapper = undefined;
  expect(stop).toHaveBeenCalled();
});
it("encerra stream mesmo se a permissão chegar depois da saída", async () => {
  let accept;
  getUserMedia.mockReturnValue(new Promise((resolve) => { accept = resolve; }));
  wrapper = mount(CameraView, { props: { product } });
  wrapper.unmount(); wrapper = undefined;
  accept(stream);
  await settle();
  expect(stop).toHaveBeenCalled();
});
it("encerra stream se a página for ocultada antes de conceder permissão", async () => {
  let accept;
  getUserMedia.mockReturnValue(new Promise((resolve) => { accept = resolve; }));
  wrapper = mount(CameraView, { props: { product } });
  window.dispatchEvent(new Event("pagehide"));
  accept(stream);
  await settle();
  expect(stop).toHaveBeenCalled();
  expect(wrapper.find("video").element.srcObject).not.toBe(stream);
});
it("exibe permissão negada e não oculta o erro", async () => {
  getUserMedia.mockRejectedValue({ name: "NotAllowedError" });
  wrapper = mount(CameraView, { props: { product } });
  await settle();
  expect(wrapper.find("#cam-status").text()).toContain("Permita");
  expect(wrapper.find("#cam-status").classes()).toContain("is-error");
});
it("não solicita câmera fora de contexto seguro", async () => {
  vi.stubGlobal("isSecureContext", false);
  wrapper = mount(CameraView, { props: { product } });
  await settle();
  expect(getUserMedia).not.toHaveBeenCalled();
  expect(wrapper.find("#cam-status").text()).toContain("HTTPS");
});
it("encerra a câmera se o vídeo não puder tocar", async () => {
  HTMLMediaElement.prototype.play.mockRejectedValue(new Error("play"));
  wrapper = mount(CameraView, { props: { product } });
  await settle();
  expect(stop).toHaveBeenCalled();
  expect(wrapper.find("#cam-status").classes()).toContain("is-error");
});
it("mantém giro, centralização e erro de modelo", async () => {
  wrapper = mount(CameraView, { props: { product } });
  await settle();
  await wrapper.find("#btn-spin").trigger("click");
  expect(wrapper.find("model-viewer").element.autoRotate).toBe(true);
  await wrapper.find("#btn-reset").trigger("click");
  expect(wrapper.find("model-viewer").element.cameraTarget).toBe("auto auto auto");
  await wrapper.find("model-viewer").trigger("error");
  expect(wrapper.find("#cam-status").text()).toContain("modelo 3D");
});
