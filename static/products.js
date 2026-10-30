// Modelo de teste, usado enquanto o produto não tem o seu próprio .glb
const DEMO_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
const DEMO_USDZ = "https://modelviewer.dev/shared-assets/models/Astronaut.usdz";

// Catálogo. Para cada produto:
//   image: foto em /static/img/ (se vazio, aparece o emoji)
//   cutout: foto do produto SEM fundo (PNG transparente) para mostrar na mesa
//   glb / usdz: modelo 3D em /static/models/ (se vazio, usa o modelo de teste)
//   arScale: tamanho no cartão da mesa (1 = largura do cartão; padrão 0.6)
const PRODUCTS = [
  { 
    id: "classico", 
    category: "Hambúrgueres", 
    name: "Clássico", 
    desc: "Pão brioche, hambúrguer bovino, queijo, alface, tomate e molho da casa.", 
    price: "R$ 29,90", 
    emoji: "🍔", 
    tint: "#fde7d3", 
    image: "/static/images/images (1).jpg", 
    cutout: "", // DEIXE VAZIO para não forçar o modo foto 2D
    glb: "/static/models/hamburguer-teste.glb", // <--- ADICIONE O MODELO 3D AQUI
    usdz: "" 
  },
  // ... demais produtos
];