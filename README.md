# Cardápio digital — demonstração FastAPI

Catálogo demonstrativo em Python/FastAPI para apresentar a lojistas como os produtos do estabelecimento podem aparecer em uma vitrine digital. A página inicial identifica a experiência como uma demonstração, com filtros por categoria, cartões e detalhes dos produtos.

## Produtos de demonstração
- **Clássico:** hambúrguer com foto recortada e fundo transparente.
- **Pizza de Pepperoni:** pizza com foto recortada e fundo transparente, no mesmo estilo visual do hambúrguer. O preço permanece como “Preço a definir”.

As imagens de cada produto são configuradas em `static/products.js`: `image` guarda a foto e `cutout` a versão recortada usada nos cartões e nas experiências de câmera e cartão AR. As imagens ficam em `static/images/`.

## Requisitos
- Python 3.10 ou superior
- Conexão com a internet para carregar as bibliotecas usadas nas experiências de câmera e realidade aumentada

## Executar no Windows (PowerShell)

```powershell
cd cardapio3d-fastapi
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Abra `http://127.0.0.1:8000`. Para parar o servidor, pressione `Ctrl+C` no terminal.

## Executar no macOS/Linux

```bash
cd cardapio3d-fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Abra `http://127.0.0.1:8000`. Para parar o servidor, pressione `Ctrl+C` no terminal.

## Ver na minha mesa

Na página de detalhes de um produto com foto, **Ver na minha mesa** abre a câmera e posiciona o recorte do produto sobre a imagem capturada. É possível arrastar a imagem, ajustar seu tamanho com pinça e incliná-la. O botão **Girar** inclina a foto em incrementos de 15°; não produz uma rotação 3D do alimento.

## Ver com cartão de mesa

**Ver com cartão de mesa** abre a experiência de realidade aumentada associada ao produto. Ela usa um cartão reconhecido pela câmera para posicionar a foto recortada. A disponibilidade depende do aparelho, do navegador e do acesso às bibliotecas externas.

O recorte transparente destaca o produto na imagem, mas não cria informações sobre os lados ou a parte de trás. Para um giro 360° realista, são necessárias fotos do mesmo produto tiradas de vários ângulos.

## Câmera no celular

Para testar a câmera em um celular, abra a aplicação por HTTPS em um endereço acessível ao aparelho e permita o acesso à câmera. O `localhost` do computador não fica automaticamente acessível pelo telefone.
