<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { fetchProducts, selectProduct } from "./catalog.js";
import { loadLibraries } from "./libraries.js";
import CatalogView from "./views/CatalogView.vue";
import CameraView from "./views/CameraView.vue";
import ArView from "./views/ArView.vue";

const products = ref([]);
const loading = ref(true);
const error = ref("");
const route = window.location.pathname;
const id = new URLSearchParams(window.location.search).get("id");
let disposed = false;

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await fetchProducts();
    if (disposed) return;
    await loadLibraries(route);
    if (!disposed) products.value = data;
  } catch (cause) {
    if (!disposed) error.value = cause.message || "Não foi possível carregar o cardápio.";
  } finally {
    if (!disposed) loading.value = false;
  }
}
onMounted(load);
onBeforeUnmount(() => { disposed = true; });
</script>

<template>
  <main v-if="loading" class="app-message" role="status">Carregando cardápio...</main>
  <main v-else-if="error" class="app-message">
    <p role="alert">{{ error }}</p>
    <button type="button" @click="load">Tentar novamente</button>
    <a v-if="route !== '/'" href="/">Voltar ao cardápio</a>
  </main>
  <CameraView v-else-if="route === '/camera'" :product="selectProduct(products, id)" />
  <ArView v-else-if="route === '/ar'" :product="selectProduct(products, id)" />
  <CatalogView v-else :products="products" />
</template>

<style>
.app-message { position: fixed; inset: 0; display: grid; place-content: center;
  gap: 16px; padding: 24px; background: #fff; color: #202020; font-family: Arial, sans-serif; }
.app-message button, .app-message a { padding: 12px; font: inherit; }
</style>
