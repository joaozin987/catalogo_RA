// Faz a foto ficar sempre virada para a câmera (gira só na vertical)
AFRAME.registerComponent("face-camera", {
  init() {
    this.camPos = new AFRAME.THREE.Vector3();
  },
  tick() {
    const camera = this.el.sceneEl.camera;
    const parent = this.el.object3D.parent;
    if (!camera || !parent) return;
    camera.getWorldPosition(this.camPos);
    parent.worldToLocal(this.camPos);
    this.el.object3D.rotation.y = Math.atan2(this.camPos.x, this.camPos.z);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const product = PRODUCTS.find((p) => p.id === params.get("id")) || PRODUCTS[0];
  const status = document.getElementById("ar-status");
  const scene = document.querySelector("a-scene");

  document.getElementById("ar-name").textContent = product.name;
  document.getElementById("ar-price").textContent = product.price;
  document.title = product.name + " na mesa";

  function showError(message) {
    status.textContent = message;
    status.classList.add("is-error");
    status.hidden = false;
  }

  // Use o modelo 3D quando houver; a foto continua sendo o fallback.
  const photoSrc = product.glb ? "" : (product.cutout || product.image || "");

  if (photoSrc) {
    document.querySelectorAll(".product-model").forEach((model) => model.setAttribute("visible", "false"));

    const url = encodeURI(photoSrc);
    const probe = new Image();
    probe.onload = () => {
      // Largura em relação ao cartão (1 = largura do cartão)
      const width = product.arScale || 0.9;
      const height = (width * probe.naturalHeight) / probe.naturalWidth;
      document.querySelectorAll(".photo-holder").forEach((holder) => {
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
    document.querySelectorAll(".product-model").forEach((model) => {
      model.setAttribute("gltf-model", product.glb);
      model.setAttribute("scale", scale + " " + scale + " " + scale);
    });
  }

  // A câmera só funciona em HTTPS (ou localhost)
  if (!window.isSecureContext) {
    showError("A câmera exige HTTPS. Abra este endereço pelo link https do túnel.");
    return;
  }

  document.querySelectorAll("a-marker").forEach((marker) => {
    marker.addEventListener("markerFound", () => { status.hidden = true; });
    marker.addEventListener("markerLost", () => { status.hidden = false; });
  });

  scene.addEventListener("camera-error", () => {
    showError("Não foi possível abrir a câmera. Permita o acesso à câmera nas configurações do navegador.");
  });
});