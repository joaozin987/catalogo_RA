document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const grid = $("grid");
  const catNav = $("categories");
  const dialog = $("product-dialog");
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
      const photoSrc = p.cutout || p.image;
      if (photoSrc) {
        const img = new Image();
        img.src = photoSrc;
        img.alt = p.name;
        img.loading = "lazy";
        img.classList.toggle("is-cutout", Boolean(p.cutout));
        media.appendChild(img);
      } else {
        const emoji = el("span", "card-emoji", p.emoji || "🍽️");
        emoji.setAttribute("aria-hidden", "true");
        media.appendChild(emoji);
      }
      media.appendChild(el("span", "badge", photoSrc ? "FOTO" : "EM BREVE"));

      const body = el("div", "card-body");
      body.appendChild(el("h3", "card-title", p.name));
      body.appendChild(el("p", "card-desc", p.desc));

      const foot = el("div", "card-foot");
      foot.appendChild(el("span", "card-price", p.price));
      foot.appendChild(el("span", "card-cta", photoSrc ? "Ver foto" : "Personalizar"));
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

    const photoSrc = p.cutout || p.image;

    stagePhoto.hidden = false;
    stagePhoto.style.background = p.tint || "#f1f2f4";
    stageImg.hidden = !photoSrc;
    stageEmoji.hidden = Boolean(photoSrc);
    if (photoSrc) {
      stageImg.src = photoSrc;
      stageImg.alt = p.name;
    }
    stageEmoji.textContent = p.emoji || "🍽️";
    const hasPhoto = Boolean(photoSrc);
    $("camera-link").hidden = !hasPhoto;
    $("marker-link").hidden = !hasPhoto;
    dialog.querySelector(".ar-tip").hidden = !hasPhoto;
    $("camera-link").href = "/camera?id=" + encodeURIComponent(p.id);
    $("marker-link").href = "/ar?id=" + encodeURIComponent(p.id);
    dialog.showModal();
  }

  $("sheet-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });


  renderCategories();
  renderGrid();
});