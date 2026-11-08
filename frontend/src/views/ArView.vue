<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { mountAr } from "../controllers/ar.js";
const props = defineProps({ product: { type: Object, required: true } });
const root = ref(null);
let cleanup;
onMounted(() => { cleanup = mountAr(root.value, props.product); });
onBeforeUnmount(() => cleanup?.());
</script>
<template>
<div ref="root">

  <div class="ar-top">
    <a class="ar-back" href="/">‹ Cardápio</a>
  </div>

  <a-scene embedded vr-mode-ui="enabled: false" arjs="sourceType: webcam; debugUIEnabled: false;">
    <a-light type="ambient" intensity="1.1"></a-light>
    <a-light type="directional" intensity="1.4" position="1 3 2"></a-light>

    <!-- Cartão da mesa -->
    <a-marker type="pattern" url="/static/marker/marcador.patt" smooth="true" smoothCount="8" smoothTolerance="0.01" smoothThreshold="5">
      <a-entity animation="property: rotation; to: 0 360 0; dur: 16000; easing: linear; loop: true">
        <a-entity class="product-model"></a-entity>
      </a-entity>
      <!-- Foto do produto em pé sobre o cartão (sempre virada para a câmera) -->
      <a-entity class="photo-holder" face-camera visible="false">
        <a-image class="photo-img" transparent="true" alpha-test="0.05" shader="flat"></a-image>
      </a-entity>
    </a-marker>

    <!-- Marcador Hiro (do AR.js), útil para testes -->
    <a-marker preset="hiro" smooth="true" smoothCount="8" smoothTolerance="0.01" smoothThreshold="5">
      <a-entity animation="property: rotation; to: 0 360 0; dur: 16000; easing: linear; loop: true">
        <a-entity class="product-model"></a-entity>
      </a-entity>
      <!-- Foto do produto em pé sobre o cartão (sempre virada para a câmera) -->
      <a-entity class="photo-holder" face-camera visible="false">
        <a-image class="photo-img" transparent="true" alpha-test="0.05" shader="flat"></a-image>
      </a-entity>
    </a-marker>

    <a-entity camera></a-entity>
  </a-scene>

  <div class="ar-bottom">
    <div class="ar-status" id="ar-status">Aponte a câmera para o cartão da mesa</div>
    <div class="ar-card">
      <strong id="ar-name"></strong>
      <span id="ar-price"></span>
    </div>
  </div>




</div>
</template>
