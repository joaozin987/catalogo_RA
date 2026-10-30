document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const grid = $("grid");
  const catNav = $("categories");
  const dialog = $("product-dialog");
  const viewer = $("product-viewer");
  const errorBox = $("model-error");
  const stagePhoto = $("photo-stage");
  const stageImg = $("stage-img");
  const stageEmoji = $("stage-emoji");

  const categories = ["Todos", ...new Set(PRODUCTS.map((p) => p.category))];
  let activeCategory = "Todos";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function renderCategories() {
    catNav.innerHTML = "";
    categories.forEach((name) => {
      const chip = el("button", "chip", name);
      chip.type = "button";
      chip.setAttribute("aria-pressed", String(name === activeCategory));
      chip.addEventListener("click", () => {
        activeCategory = name;
        renderCategories();
        renderGrid();
      });
      catNav.appendChild(chip);
    });
  }

  function renderGrid() {
    grid.innerHTML = "";
    PRODUCTS.filter((p) => activeCategory === "Todos" || p.category === activeCategory).forEach((p) => {
      const card = el("button", "card");
      card.type = "button";

      const media = el("div", "card-media");
      media.style.background = p.tint || "#f1f1f1";
      if (p.image) {
        const img = new Image();
        img.src = p.image;
        img.alt = p.name;
        img.loading = "lazy";
        media.appendChild(img);
      } else {
        const emoji = el("span", "card-emoji", p.emoji || "🍽️");
        emoji.setAttribute("aria-hidden", "true");
        media.appendChild(emoji);
      }
      media.appendChild(el("span", "badge", "3D"));

      const body = el("div", "card-body");
      body.appendChild(el("h3", "card-title", p.name));
      body.appendChild(el("p", "card-desc", p.desc));

      const foot = el("div", "card-foot");
      foot.appendChild(el("span", "card-price", p.price));
      foot.appendChild(el("span", "card-cta", "Ver em 3D"));
      body.appendChild(foot);

      card.append(media, body);
      card.addEventListener("click", () => openProduct(p));
      grid.appendChild(card);
    });
  }

  function openProduct(p) {
    $("product-category").textContent = p.category.toUpperCase();
    $("product-name").textContent = p.name;
    $("product-desc").textContent = p.desc;
    $("product-price").textContent = p.price;

    errorBox.hidden = true;
    const has3d = Boolean(p.glb);
    const photoSrc = p.cutout || p.image;

    // Sem modelo 3D, mostra a foto do produto (nunca o astronauta de teste)
    viewer.style.display = has3d ? "" : "none";
    stagePhoto.hidden = has3d;
    $("viewer-hint").hidden = !has3d;

    if (has3d) {
      viewer.alt = "Modelo 3D de " + p.name;
      viewer.src = p.glb;
      if (p.usdz) viewer.setAttribute("ios-src", p.usdz);
      else viewer.removeAttribute("ios-src");
      viewer.cameraOrbit = "0deg 75deg auto";
      viewer.autoRotate = true;
    } else {
      viewer.removeAttribute("src");
      stagePhoto.style.background = p.tint || "#f1f2f4";
      stageImg.hidden = !photoSrc;
      stageEmoji.hidden = Boolean(photoSrc);
      if (photoSrc) {
        stageImg.src = photoSrc;
        stageImg.alt = p.name;
      }
      stageEmoji.textContent = p.emoji || "🍽️";
    }

    // Botões de mesa só aparecem quando há o que mostrar
    $("camera-link").hidden = !(p.glb || photoSrc);
    $("marker-link").hidden = !(p.glb || photoSrc);
    $("camera-link").href = "/camera?id=" + encodeURIComponent(p.id);
    $("marker-link").href = "/ar?id=" + encodeURIComponent(p.id);
    dialog.showModal();
  }

  viewer.addEventListener("load", () => { errorBox.hidden = true; });
  viewer.addEventListener("error", () => { errorBox.hidden = false; });

  $("sheet-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });


  renderCategories();
  renderGrid();
});