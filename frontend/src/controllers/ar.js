export function mountAr(root, product) {
  let disposed = false;
  let probe;
  const listeners = [];
  function on(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    listeners.splice(0).forEach((remove) => remove());
    if (probe) { probe.onload = null; probe.onerror = null; }
    scene.pause?.();
    const video = scene.systems?.arjs?._arSession?.arSource?.domElement;
    if (video) {
      video.srcObject?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      video.remove();
    }
    scene.renderer?.dispose();
  }

  const status = root.querySelector("#" + "ar-status");
  const scene = root.querySelector("a-scene");

  root.querySelector("#" + "ar-name").textContent = product.name;
  root.querySelector("#" + "ar-price").textContent = product.price;
  document.title = product.name + " na mesa";

  function showError(message) {
    status.textContent = message;
    status.classList.add("is-error");
    status.hidden = false;
  }

  // Foto (recorte sem fundo ou foto do cardápio) quando o produto não tem modelo 3D
  const photoSrc = product.cutout || (!product.glb && product.image ? product.image : "");

  if (photoSrc) {
    root.querySelectorAll(".product-model").forEach((model) => model.setAttribute("visible", "false"));

    const url = encodeURI(photoSrc);
    probe = new Image();
    probe.onload = () => {
      if (disposed) return;
      // Largura em relação ao cartão (1 = largura do cartão)
      const width = product.arScale || 0.9;
      const height = (width * probe.naturalHeight) / probe.naturalWidth;
      root.querySelectorAll(".photo-holder").forEach((holder) => {
        const image = holder.querySelector(".photo-img");
        image.setAttribute("src", url);
        image.setAttribute("width", width);
        image.setAttribute("height", height);
        image.setAttribute("position", "0 " + height / 2 + " 0");
        holder.setAttribute("visible", "true");
      });
    };
    probe.onerror = () => showError("Não foi possível carregar a imagem do produto.");
    probe.src = url;
  } else if (!product.glb) {
    showError("Este item ainda não tem foto nem modelo 3D para mostrar na mesa.");
  } else {
    // Tamanho do modelo 3D em relação ao cartão (1 = largura do cartão)
    const scale = product.arScale || 0.6;
    root.querySelectorAll(".product-model").forEach((model) => {
      model.setAttribute("gltf-model", product.glb);
      model.setAttribute("scale", scale + " " + scale + " " + scale);
    });
  }

  // A câmera só funciona em HTTPS (ou localhost)
  if (!window.isSecureContext) {
    showError("A câmera exige HTTPS. Abra este endereço pelo link https do túnel.");
    return dispose;
  }

  root.querySelectorAll("a-marker").forEach((marker) => {
    on(marker, "markerFound", () => { if (!status.classList.contains("is-error")) status.hidden = true; });
    on(marker, "markerLost", () => { status.hidden = false; });
  });

  on(scene, "camera-error", () => {
    showError("Não foi possível abrir a câmera. Permita o acesso à câmera nas configurações do navegador.");
  });
  root.querySelectorAll(".product-model").forEach((model) => {
    on(model, "model-error", () => showError("Não foi possível carregar o modelo 3D."));
  });
  on(window, "pagehide", dispose);
  return dispose;
}
