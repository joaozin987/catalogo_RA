const loaded = new Set();

function script(src, module = false) {
  if (loaded.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const element = document.createElement("script");
    element.dataset.arLibrary = "true";
    element.src = src;
    if (module) element.type = "module";
    const timer = setTimeout(() => fail(), 20000);
    const fail = () => {
      clearTimeout(timer);
      element.remove();
      reject(new Error("Não foi possível carregar a biblioteca 3D/AR. Confira a conexão e tente novamente."));
    };
    element.onerror = fail;
    element.onload = () => {
      clearTimeout(timer);
      loaded.add(src);
      resolve();
    };
    document.head.append(element);
  });
}

export async function loadLibraries(route) {
  if (route !== "/ar") {
    await script("https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js", true);
    return;
  }
  if (!window.isSecureContext) throw new Error("A câmera exige HTTPS ou localhost.");
  await script("https://aframe.io/releases/1.3.0/aframe.min.js");
  const aframe = window.AFRAME;
  if (!aframe.components["face-camera"]) {
    aframe.registerComponent("face-camera", {
      init() { this.camPos = new aframe.THREE.Vector3(); },
      tick() {
        const camera = this.el.sceneEl.camera;
        const parent = this.el.object3D.parent;
        if (!camera || !parent) return;
        camera.getWorldPosition(this.camPos);
        parent.worldToLocal(this.camPos);
        this.el.object3D.rotation.y = Math.atan2(this.camPos.x, this.camPos.z);
      },
    });
  }
  await script("https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js");
}
