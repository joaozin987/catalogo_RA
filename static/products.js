// Catálogo. Para cada produto:
//   image: foto em /static/img/ (se vazio, aparece o emoji)
//   cutout: foto do produto sem fundo, usada nas experiências de câmera/AR
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
    cutout: "/static/images/classico-recorte.png"
  },
  {
    id: "pizza",
    category: "Pizzas",
    name: "Pizza de Pepperoni",
    desc: "Pizza de pepperoni.",
    price: "Preço a definir",
    emoji: "🍕",
    tint: "#f8e6ca",
    image: "/static/images/pizza-pepperoni.webp",
    cutout: "/static/images/pizza-pepperoni-cutout.png"
  }
];