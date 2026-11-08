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

---

# Cardápio 3D — Django e Vue

Catálogo com visualização 3D, câmera com sobreposição e realidade aumentada por
marcadores. Migração local do protótipo FastAPI para Django/Vue; o legado está
preservado para comparação. Não houve implantação ou alteração de banco.

## Estrutura

- `backend/`: Django 5.2.19, API GET/HEAD `/api/products`, sem banco ou login.
- `backend/catalog/products.json`: catálogo servido pela API.
- `frontend/`: Vue 3.5.45, Vite, Vitest e ESLint. As páginas continuam em `/`,
  `/camera?id=classico` e `/ar?id=classico`, com navegação por links completos.
- `static/`: imagens, modelo GLB, marcadores e CSS compartilhado com o legado.
- `main.py`, `templates/`, `static/*.js`, `requirements.txt`: FastAPI legado.
- `tests/catalog.test.cjs`: caracterização e paridade entre os catálogos.

## Requisitos e instalação

Python 3.10+ compatível com Django 5.2; ambiente verificado em Python 3.14.2.
Node.js 22.12+ (verificado em 24.12.0) e npm. Use uma versão do Python ainda
mantida pelo fornecedor. Internet é necessária para instalar pacotes e para
carregar as bibliotecas 3D/AR via CDN; o modelo do produto atual é local.

Comandos PowerShell a partir da raiz, após autorização para instalar:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
npm --prefix frontend ci
```

Para executar sem ferramentas de desenvolvimento Python, instalar somente
`backend/requirements.txt`. No Linux/macOS, criar o venv com `python3 -m venv
.venv` e substituir `.\.venv\Scripts\python.exe` por `.venv/bin/python`.

## Executar a aplicação compilada localmente

```powershell
npm --prefix frontend run build
.\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --insecure
```

Abra `http://127.0.0.1:8000`. O parâmetro `--insecure` é do servidor de
desenvolvimento Django e permite servir `/static` localmente com `DEBUG=False`;
não use esse servidor para produção. Sem build, as páginas respondem 503 com
instrução para compilar. API e HTML usam `Cache-Control: no-store`.

## Desenvolver com atualização automática

Inicie Django com o comando acima e, em outro terminal:

```powershell
npm --prefix frontend run dev
```

Abra o endereço local exibido pelo Vite (normalmente `http://127.0.0.1:5173`).
O Vite encaminha `/api` e `/static` para Django na porta 8000, evitando a
necessidade de CORS. `vite preview` isolado não fornece esse backend; para
validar o build integrado, use Django conforme a seção anterior.

## Food Reconstruction Lab

O [roteiro do laboratório](docs/LABORATORIO-3D.md) explica como habilitar
`/laboratorio-3d`, conectar o Hunyuan3D 2.1 local e avaliar a reconstrução
do Clássico. O laboratório é opcional e separado das rotas do consumidor.

## Testes e verificações

Antes de cada funcionalidade: escrever o teste, confirmar a falha pelo motivo
esperado, implementar, executar o teste focado e depois a suíte relevante.

```powershell
Push-Location backend
..\.venv\Scripts\python.exe manage.py test tests -v 2
Pop-Location
node --test tests/catalog.test.cjs
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
.\.venv\Scripts\python.exe -m ruff check backend main.py
.\.venv\Scripts\python.exe -m bandit -r backend -x backend/tests -q
.\.venv\Scripts\python.exe -m pip check
git diff --check
```

Auditorias que consultam serviços externos, após autorização:

```powershell
npm --prefix frontend audit
.\.venv\Scripts\python.exe -m pip_audit -r backend/requirements.txt
```

O teste Django deve ser executado **dentro de `backend/`**, para não confundir
seu pacote `tests` com o diretório de caracterização da raiz. O teste de paridade
mantém o catálogo migrado alinhado ao snapshot legado até sua retirada autorizada.

Testes de câmera usam streams simulados; não validam hardware, WebGL, WebXR ou
Quick Look. Veja [o roteiro manual](docs/VALIDACAO.md) para testar em celular.

## Câmera, AR e segurança

As bibliotecas continuam em model-viewer 3.5.0, A-Frame 1.3.0 e AR.js 3.4.5.
O frontend carrega somente a biblioteca correspondente à tela e mostra erro
recuperável em falha de rede. A câmera solicita vídeo sem áudio. Ao desmontar
`/camera` ou receber `pagehide`, libera streams, eventos e timers, inclusive
quando a permissão chega atrasada. A cena AR possui limpeza própria.

HTTPS e permissão do usuário são necessários no celular. O `localhost` do
computador não é o do celular. Túneis, acesso remoto e produção exigem revisão
e autorização; não estão configurados nesta migração. A escala AR é ilustrativa,
sem garantia de dimensões reais. Consulte [SECURITY.md](SECURITY.md).

Não é necessário executar `migrate` ou criar usuários. `DEBUG` fica desligado
por padrão e os hosts permitidos são locais. `DJANGO_SECRET_KEY` pode ser
fornecida pelo ambiente; sem ela há uma chave efêmera gerada no processo para
uso local, sem persistência de sessões. Produção requer configuração própria.

## Retorno ao legado

Sem apagar os novos diretórios, instalar as dependências legadas autorizadas
e executar em outra porta:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Abrir `http://127.0.0.1:8001`. A retirada do legado será uma etapa separada e
autorizada após a validação da migração.
