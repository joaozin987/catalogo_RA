<script setup>
import { onBeforeUnmount, ref } from "vue";
import { loadLibraries } from "../libraries.js";

const sample = "/static/images/classico-recorte.png";
const maxImageBytes = 8 * 1024 * 1024;
const imageUrl = ref("");
const imageName = ref("");
const modelUrl = ref("");
const modelSize = ref("");
const error = ref("");
const viewerError = ref("");
const status = ref("");
const viewerReady = ref(false);
const controller = new AbortController();
const { signal } = controller;
let image;

function clearModel() {
  if (modelUrl.value) URL.revokeObjectURL(modelUrl.value);
  modelUrl.value = "";
  viewerError.value = "";
}

function selectImage(file, name) {
  if (!["image/png", "image/jpeg"].includes(file.type) || !file.size || file.size > maxImageBytes) {
    error.value = "Selecione uma imagem PNG ou JPEG de até 8 MiB.";
    return;
  }
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  clearModel();
  image = file;
  imageName.value = name;
  imageUrl.value = URL.createObjectURL(file);
}

function upload(event) {
  error.value = "";
  const file = event.target.files[0];
  if (file) selectImage(file, file.name);
  event.target.value = "";
}

async function useSample() {
  error.value = "";
  status.value = "Carregando a imagem do Clássico…";
  try {
    const response = await fetch(sample, { signal });
    if (!response.ok) throw new Error();
    const file = await response.blob();
    if (!signal.aborted) selectImage(file, "Clássico · PNG do catálogo");
  } catch {
    if (!signal.aborted) error.value = "Não foi possível carregar a imagem do Clássico.";
  } finally {
    status.value = "";
  }
}

async function openViewer() {
  viewerError.value = "";
  try {
    await loadLibraries("/laboratorio-3d");
    if (!signal.aborted) viewerReady.value = true;
  } catch {
    if (!signal.aborted) viewerError.value = "Não foi possível carregar o visualizador 3D.";
  }
}

async function generate() {
  if (!image || status.value) return;
  error.value = "";
  clearModel();
  status.value = "Gerando geometria e textura no Hunyuan3D 2.1. Isso pode levar alguns minutos.";
  try {
    const csrf = document.cookie.split("; ").find((item) => item.startsWith("csrftoken="));
    if (!csrf) throw new Error("Reabra o laboratório pelo servidor Django local e tente novamente.");
    const response = await fetch("/api/laboratorio-3d/reconstruir", {
      method: "POST",
      headers: { "Content-Type": image.type, "X-CSRFToken": csrf.slice("csrftoken=".length) },
      body: image,
      signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Falha na geração (HTTP ${response.status}).`);
    }
    const model = await response.blob();
    if (signal.aborted) return;
    if (model.type !== "model/gltf-binary" || !model.size) throw new Error("GLB ausente na resposta.");
    modelUrl.value = URL.createObjectURL(model);
    modelSize.value = (model.size / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    await openViewer();
  } catch (cause) {
    if (!signal.aborted) error.value = cause.message;
  } finally {
    status.value = "";
  }
}

onBeforeUnmount(() => {
  controller.abort();
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  clearModel();
});
</script>

<template>
  <main class="lab">
    <header>
      <p>Catálogo RA · Experimento 01</p>
      <h1>Food Reconstruction Lab</h1>
      <p>Compare a foto original com a geometria e a textura geradas pelo Hunyuan3D 2.1 local.</p>
    </header>
    <form @submit.prevent="generate">
      <fieldset :disabled="Boolean(status)">
        <legend>Imagem de referência</legend>
        <label for="lab-image">Enviar PNG ou JPEG de até 8 MiB</label>
        <input id="lab-image" type="file" accept="image/png,image/jpeg" @change="upload">
        <div class="actions">
          <button data-sample type="button" @click="useSample">Usar PNG do Clássico</button>
          <button type="submit" :disabled="!imageUrl">Gerar GLB</button>
        </div>
      </fieldset>
    </form>
    <p v-if="status" role="status">{{ status }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <div class="comparison">
      <section>
        <h2>Imagem original</h2>
        <img v-if="imageUrl" :src="imageUrl" :alt="imageName">
        <p v-else>Selecione uma foto para começar.</p>
      </section>
      <section>
        <h2>Modelo reconstruído</h2>
        <template v-if="modelUrl">
          <model-viewer
            v-if="viewerReady && !viewerError" :src="modelUrl"
            alt="Modelo 3D reconstruído da imagem de referência"
            camera-controls touch-action="pan-y" shadow-intensity="0.5"
            @error="viewerError = 'O visualizador não conseguiu renderizar este GLB.'"
          />
          <p v-if="viewerError" role="alert">{{ viewerError }}</p>
          <button v-if="viewerError && !viewerReady" type="button" @click="openViewer">
            Recarregar visualizador
          </button>
          <p>Arraste para girar. Use a roda do mouse ou o gesto de pinça para aproximar.</p>
          <a :href="modelUrl" download="reconstrucao.glb">Baixar GLB experimental · {{ modelSize }} MiB</a>
        </template>
        <p v-else>O resultado aparece aqui após a geração.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lab { max-width: 72rem; margin: auto; padding: clamp(1rem, 4vw, 3rem); color: #20252c;
  font-family: system-ui, sans-serif; }
.lab header { margin-bottom: 1.5rem; }
.lab h1 { margin-block: 0.25rem; }
.lab h2 { margin-top: 0; }
.lab fieldset { display: grid; gap: 0.75rem; margin: 0; padding: 1rem;
  border: 1px solid #bfc9d5; border-radius: 0.75rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.lab button { padding: 0.6rem 0.85rem; font: inherit; }
.comparison { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: 1rem; margin-top: 1.5rem; }
.comparison section { padding: 1rem; background: #eef2f6; border-radius: 0.75rem; }
.comparison img, model-viewer { display: block; width: 100%; height: clamp(16rem, 40vw, 28rem);
  object-fit: contain; background: #e1e7ed; border-radius: 0.5rem; }
</style>
