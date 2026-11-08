<script setup>
import { computed, nextTick, ref } from "vue";

const props = defineProps({ products: { type: Array, required: true } });
const category = ref("Todos");
const categories = computed(() => ["Todos", ...new Set(props.products.map((product) => product.category))]);
const visibleProducts = computed(() => props.products.filter((product) => category.value === "Todos" || product.category === category.value));
const selected = ref(null);
const dialog = ref(null);
const modelError = ref(false);
const modelLoading = ref(false);
const photo = computed(() => selected.value?.cutout || selected.value?.image);

async function openProduct(product) {
  if (selected.value?.id !== product.id || selected.value?.glb !== product.glb) {
    modelLoading.value = Boolean(product.glb);
    modelError.value = false;
  }
  selected.value = product;
  await nextTick();
  if (!dialog.value.open) dialog.value.showModal();
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <p class="eyebrow">CARDÁPIO</p>
      <h1>Escolha seu pedido.</h1>
      <p class="subtitle">Toque em um item para ver os detalhes e colocar na sua mesa.</p>
    </header>
    <nav class="categories" aria-label="Categorias">
      <button v-for="name in categories" :key="name" class="chip" type="button"
        :aria-pressed="name === category" @click="category = name">{{ name }}</button>
    </nav>
    <section class="grid" aria-live="polite">
      <button v-for="product in visibleProducts" :key="product.id" class="card" type="button" @click="openProduct(product)">
        <div class="card-media" :style="{ background: product.tint || '#f1f1f1' }">
          <img v-if="product.image" :src="product.image" :alt="product.name" loading="lazy">
          <span v-else class="card-emoji" aria-hidden="true">{{ product.emoji || '🍽️' }}</span>
          <span v-if="product.glb" class="badge">3D</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">{{ product.name }}</h3>
          <p class="card-desc">{{ product.desc }}</p>
          <div class="card-foot"><span class="card-price">{{ product.price }}</span><span class="card-cta">{{ product.glb ? "Ver em 3D" : "Ver detalhes" }}</span></div>
        </div>
      </button>
    </section>
    <footer>Cardápio em realidade aumentada</footer>
  </main>

  <dialog ref="dialog" class="sheet" aria-labelledby="product-name" @click="($event.target === dialog) && dialog.close()">
    <template v-if="selected">
      <button class="sheet-close" type="button" aria-label="Fechar" @click="dialog.close()">×</button>
      <div class="sheet-grid">
        <div class="viewer-stage">
          <model-viewer v-if="selected.glb" :key="selected.id" :src="selected.glb" :ios-src="selected.usdz || undefined"
            :alt="'Modelo 3D de ' + selected.name" id="product-viewer" ar ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor" ar-scale="auto" xr-environment camera-controls touch-action="pan-y" auto-rotate
            shadow-intensity="1" shadow-softness="0.8" exposure="1" environment-image="neutral" camera-orbit="0deg 75deg auto"
            reveal="auto" @error="modelError = true; modelLoading = false" @load="modelError = false; modelLoading = false">
            <button slot="ar-button" hidden type="button"></button>
            <div slot="progress-bar">
              <div v-if="modelLoading" class="loading"><span class="spinner"></span>Carregando modelo 3D...</div>
            </div>
          </model-viewer>
          <div v-else class="photo-stage" :style="{ background: selected.tint || '#f1f2f4' }">
            <img v-if="photo" id="stage-img" :src="photo" :alt="selected.name">
            <span v-else class="stage-emoji" aria-hidden="true">{{ selected.emoji || '🍽️' }}</span>
          </div>
        </div>
        <div class="sheet-body">
          <span class="tag">{{ selected.category.toUpperCase() }}</span>
          <h2 id="product-name">{{ selected.name }}</h2>
          <p class="description">{{ selected.desc }}</p>
          <div class="price">{{ selected.price }}</div>
          <template v-if="selected.glb || photo">
            <a id="camera-link" class="primary-link" :href="'/camera?id=' + encodeURIComponent(selected.id)">Ver na minha mesa</a>
            <a id="marker-link" class="secondary-link" :href="'/ar?id=' + encodeURIComponent(selected.id)">Usar o cartão da mesa (fica mais fixo)</a>
          </template>
          <p v-if="selected.glb" class="hint">Arraste para girar · Use dois dedos para aproximar</p>
          <p class="ar-tip"><strong>Como funciona:</strong> toque em “Ver na minha mesa” e permita a câmera.
            O prato aparece na tela, na direção para onde você apontar. Arraste para girar,
            use dois dedos para aproximar, afastar e mover.</p>
          <div v-if="modelError" class="model-error" role="alert">Não foi possível carregar o modelo 3D. Confira a conexão e tente novamente.</div>
        </div>
      </div>
    </template>
  </dialog>
</template>
