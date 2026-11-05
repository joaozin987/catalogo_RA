const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "static/products.js"), "utf8");
const products = vm.runInNewContext(source + "\nJSON.stringify(PRODUCTS);");
const catalog = JSON.parse(products);

test("catálogo Django preserva integralmente o catálogo legado", () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, "backend/catalog/products.json"), "utf8"));
  assert.deepEqual(data, catalog);
});

test("preserva os dados do produto clássico durante a migração", () => {
  const product = catalog.find((item) => item.id === "classico");
  assert.ok(product);
  assert.equal(product.name, "Clássico");
  assert.equal(product.category, "Hambúrgueres");
  assert.equal(product.price, "R$ 29,90");
  assert.equal(product.glb, "/static/models/hamburguer-teste.glb");
  assert.equal(product.cutout, "");
});

test("catálogo tem IDs únicos e conteúdo necessário para renderizar os cards", () => {
  assert.ok(catalog.length > 0);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  for (const product of catalog) {
    for (const field of ["id", "name", "category", "desc", "price"]) {
      assert.equal(typeof product[field], "string");
      assert.ok(product[field].trim(), `${product.id}: ${field} vazio`);
    }
  }
});

test("imagens e modelos locais usados pelo catálogo existem", () => {
  for (const product of catalog) {
    for (const field of ["image", "cutout", "glb", "usdz"]) {
      const url = product[field];
      if (!url || !url.startsWith("/static/")) continue;
      const file = path.resolve(root, "." + decodeURIComponent(url));
      assert.ok(file.startsWith(root + path.sep));
      assert.ok(fs.statSync(file).isFile(), `${product.id}: ${field} ausente`);
    }
  }
});
