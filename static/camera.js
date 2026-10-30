document.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const product = PRODUCTS.find((p) => p.id === params.get("id")) || PRODUCTS[0];

  const video = $("cam");
  const viewer = $("product");
  const status = $("cam-status");
  const spinButton = $("btn-spin");
  const layer = $("photo-layer");
  const photo = $("photo");
  const photoImg = $("photo-img");

  $("cam-name").textContent = product.name;
  $("cam-price").textContent = product.price;
  document.title = product.name + " na mesa";

  function showError(message) {
    status.textContent = message;
    status.classList.add("is-error");
    status.hidden = false;
  }

  // Determina se deve usar o modo foto 2D (recorte transparente) ou 3D
  const photoSrc = product.cutout || (!product.glb && product.image ? product.image : "");
  const photoMode = Boolean(photoSrc && !product.glb);

  const state = { x: 0, y: 0, s: 1, r: 0 };

  function applyPhoto() {
    photo.style.transform =
      "translate(calc(-50% + " + state.x + "px), calc(-50% + " + state.y + "px)) " +
      "rotate(" + state.r + "rad) scale(" + state.s + ")";
  }

  if (photoMode) {
    // Modo Foto 2D (Recorte na mesa)
    viewer.style.display = "none";
    spinButton.hidden = true;
    layer.hidden = false;
    photo.classList.toggle("is-raw", !product.cutout);
    photoImg.alt = product.name;
    photoImg.src = photoSrc;
    photoImg.addEventListener("error", () => showError("Não foi possível carregar a imagem do produto."));
    status.textContent = "Arraste para mover · Pinça para ajustar o tamanho · Gire com dois dedos";

    const pointers = new Map();
    let base = { ...state };
    let startMid = { x: 0, y: 0 };
    let startDist = 1;
    let startAngle = 0;

    const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    function snapshot() {
      base = { ...state };
      const pts = [...pointers.values()];
      if (pts.length === 1) {
        startMid = { ...pts[0] };
      } else if (pts.length >= 2) {
        startDist = dist(pts[0], pts[1]);
        startAngle = angle(pts[0], pts[1]);
        startMid = mid(pts[0], pts[1]);
      }
    }

    layer.addEventListener("pointerdown", (event) => {
      layer.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      snapshot();
    });

    layer.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const pts = [...pointers.values()];
      if (pts.length === 1) {
        state.x = base.x + (pts[0].x - startMid.x);
        state.y = base.y + (pts[0].y - startMid.y);
      } else {
        const m = mid(pts[0], pts[1]);
        state.x = base.x + (m.x - startMid.x);
        state.y = base.y + (m.y - startMid.y);
        state.s = Math.min(4, Math.max(0.2, base.s * (dist(pts[0], pts[1]) / startDist)));
        state.r = base.r + (angle(pts[0], pts[1]) - startAngle);
      }
      applyPhoto();
    });

    const release = (event) => {
      pointers.delete(event.pointerId);
      snapshot();
    };
    layer.addEventListener("pointerup", release);
    layer.addEventListener("pointercancel", release);

    layer.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.s = Math.min(4, Math.max(0.2, state.s * (event.deltaY < 0 ? 1.08 : 0.92)));
      applyPhoto();
    }, { passive: false });

    $("btn-reset").addEventListener("click", () => {
      Object.assign(state, { x: 0, y: 0, s: 1, r: 0 });
      applyPhoto();
    });

  } else if (!product.glb && !photoSrc) {
    viewer.style.display = "none";
    spinButton.hidden = true;
    $("btn-reset").hidden = true;
    showError("Este item ainda não tem modelo 3D nem foto configurados.");
  } else {
    // Modo 3D / WebAR com <model-viewer>
    viewer.style.display = "block";
    layer.hidden = true;
    spinButton.hidden = false;

    viewer.alt = "Modelo 3D de " + product.name;
    viewer.src = product.glb;
    if (product.usdz) {
      viewer.iosSrc = product.usdz;
    }

    // Atributos essenciais para ativar Realidade Aumentada e controlos 3D
    viewer.setAttribute("ar", "");
    viewer.setAttribute("ar-modes", "webxr scene-viewer quick-look");
    viewer.setAttribute("camera-controls", "");
    viewer.setAttribute("touch-action", "pan-y");
    viewer.setAttribute("shadow-intensity", "1.5");
    viewer.setAttribute("shadow-softness", "1");
    viewer.setAttribute("exposure", "1.2");

    status.textContent = "Gire o modelo na tela ou clique em AR para ver na mesa!";

    viewer.addEventListener("error", () => {
      showError("Não foi possível carregar o modelo 3D (.glb). Verifique o caminho do ficheiro.");
    });

    $("btn-reset").addEventListener("click", () => {
      viewer.cameraOrbit = "0deg 78deg 170%";
      viewer.cameraTarget = "auto auto auto";
      viewer.fieldOfView = "auto";
    });

    spinButton.addEventListener("click", () => {
      viewer.autoRotate = !viewer.autoRotate;
      spinButton.setAttribute("aria-pressed", String(viewer.autoRotate));
    });
  }

  // Inicialização da câmara traseira do telemóvel
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError("A câmara exige uma ligação segura (HTTPS). Abra através do link HTTPS.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    setTimeout(() => { 
      if (!status.classList.contains("is-error")) status.hidden = true; 
    }, 7000);

    window.addEventListener("pagehide", () => {
      stream.getTracks().forEach((track) => track.stop());
    });
  } catch (error) {
    if (error && error.name === "NotAllowedError") {
      showError("Permita o acesso à câmara nas definições do navegador e atualize a página.");
    } else if (error && error.name === "NotFoundError") {
      showError("Nenhuma câmara foi detetada neste dispositivo.");
    } else {
      showError("Não foi possível iniciar a câmara.");
    }
  }
});