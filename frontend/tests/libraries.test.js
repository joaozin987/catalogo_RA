import { afterEach, expect, it, vi } from "vitest";
import { loadLibraries } from "../src/libraries.js";

afterEach(() => { document.head.querySelectorAll("script[data-ar-library]").forEach((script) => script.remove()); });
it("reporta falha da biblioteca 3D e permite nova tentativa", async () => {
  const pending = loadLibraries("/");
  const script = document.head.querySelector("script[data-ar-library]");
  expect(script.type).toBe("module");
  script.dispatchEvent(new Event("error"));
  await expect(pending).rejects.toThrow("biblioteca");
  const retry = loadLibraries("/");
  const next = document.head.querySelector("script[data-ar-library]");
  next.dispatchEvent(new Event("load"));
  await expect(retry).resolves.toBeUndefined();
});
it("não carrega AR.js fora de HTTPS", async () => {
  vi.stubGlobal("isSecureContext", false);
  await expect(loadLibraries("/ar")).rejects.toThrow("HTTPS");
  expect(document.head.querySelector("script[data-ar-library]")).toBeNull();
  vi.unstubAllGlobals();
});
