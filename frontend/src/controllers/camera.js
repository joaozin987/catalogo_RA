export function mountCamera(root, product) {
  let disposed = false;
  let stream;
  let timer;
  const listeners = [];
  function on(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    listeners.push(() => target.removeEventListener(event, handler, options));
  }
  function stopCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    const video = root.querySelector("video");
    if (video) video.srcObject = null;
  }
  function dispose() {
    disposed = true;
    clearTimeout(timer);
    listeners.splice(0).forEach((remove) => remove());
    stopCamera();
  }
  const $ = (id) => root.querySelector("#" + id);

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
    on(photoImg, "error", () => showError("Não foi possível carregar a imagem do produto."));
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

    on(layer, "pointerdown", (event) => {
      layer.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      snapshot();
    });

    on(layer, "pointermove", (event) => {
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
    on(layer, "pointerup", release);
    on(layer, "pointercancel", release);

    on(layer, "wheel", (event) => {
      event.preventDefault();
      state.s = Math.min(4, Math.max(0.2, state.s * (event.deltaY < 0 ? 1.08 : 0.92)));
      applyPhoto();
    }, { passive: false });

    on($("btn-reset"), "click", () => {
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

    on(viewer, "error", () => {
      showError("Não foi possível carregar o modelo 3D (.glb). Verifique o caminho do ficheiro.");
    });

    on($("btn-reset"), "click", () => {
      viewer.cameraOrbit = "0deg 78deg 170%";
      viewer.cameraTarget = "auto auto auto";
      viewer.fieldOfView = "auto";
    });

    on(spinButton, "click", () => {
      viewer.autoRotate = !viewer.autoRotate;
      spinButton.setAttribute("aria-pressed", String(viewer.autoRotate));
    });
  }


  async function startCamera() {
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError("A câmara exige uma ligação segura (HTTPS). Abra através do link HTTPS.");
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      if (disposed) { stopCamera(); return; }
      video.srcObject = stream;
      await video.play();
      if (disposed) return;

      timer = setTimeout(() => {
        if (!status.classList.contains("is-error")) status.hidden = true;
      }, 7000);
    } catch (error) {
      stopCamera();
      if (disposed) return;
      if (error && error.name === "NotAllowedError") {
        showError("Permita o acesso à câmara nas definições do navegador e atualize a página.");
      } else if (error && error.name === "NotFoundError") {
        showError("Nenhuma câmara foi detetada neste dispositivo.");
      } else {
        showError("Não foi possível iniciar a câmara.");
      }
    }
  }
  on(window, "pagehide", dispose);
  startCamera();
  return dispose;
}
