# Instruções do projeto catalogo_RA

## Papel e contexto

Manter o protótipo de cardápio 3D/realidade aumentada, preservando navegação,
catálogo, acesso consentido à câmera e compatibilidade móvel. Estas instruções
complementam as regras globais; leia também `README.md` e `SECURITY.md` antes
de editar. Priorize segurança e integridade, correção, testes e clareza.

## Stack e mapa de edição

- Python 3.10+; Django 5.2.19 no backend sem banco, login ou migrations.
  Verificado em Python 3.14.2; usar runtime ainda mantido pelo fornecedor.
- Vue 3.5.45, Vite 8.3.6 e JavaScript nativo; Node.js 22.12+ (local: 24.12.0).
  Versões npm fixadas e `frontend/package-lock.json` versionado.
- Bibliotecas via CDN: model-viewer 3.5.0, A-Frame 1.3.0 e AR.js 3.4.5.
- `backend/config/`: settings, URLs e entradas ASGI/WSGI. Hosts apenas locais e
  DEBUG desligado por padrão. Não executar migrations; `DATABASES = {}`.
- `backend/catalog/`: views de leitura e `products.json`, catálogo da API
  `/api/products`. API e HTML usam `Cache-Control: no-store`.
- `backend/tests/`: testes Django sem acesso a banco.
- `frontend/src/views/`: componentes Vue do catálogo, câmera e AR.
  `controllers/`: adaptação dos gestos/câmera/AR com limpeza ao desmontar.
  `catalog.js`: API e seleção; `libraries.js`: carga condicional das CDNs.
- `frontend/tests/`: Vitest/jsdom; câmera, cenas e bibliotecas simuladas.
- `main.py` (legado preservado): FastAPI, middleware `Cache-Control: no-store`, montagem
  de `/static` e rotas GET `/`, `/ar` e `/camera`.
- `templates/`: HTML legado lido diretamente, sem renderizador de templates.
- `static/products.js`: snapshot legado `PRODUCTS`; `app.js`: catálogo e diálogo;
  `ar.js`: marcadores; `camera.js`: câmera, gestos e visualização.
- `static/*.css`: estilos; `static/images/`, `models/` e `marker/`: recursos
  necessários à experiência. GLB e imagens têm função no produto; preserve-os.
- `tests/catalog.test.cjs`: caracterização do catálogo e paridade com Django.
- Podem ser lidos e alterados os fontes, testes, configs e documentos acima,
  conforme a tarefa. Não editar `.git/`, `.venv/`, `node_modules/`,
  `frontend/dist/` ou caches como solução. Preservar o legado até autorização
  para retirada; mudanças no catálogo precisam manter a paridade durante a transição.
- Não há banco, login, uploads ou CI. FastAPI/Uvicorn permanecem em
  `requirements.txt` para retorno ao legado; não são o backend migrado.

## Comandos (PowerShell, na raiz)

Instalação inicial, somente com autorização para instalar dependências:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
npm --prefix frontend ci
```

Desenvolvimento local:

```powershell
npm --prefix frontend run build
.\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --insecure
```

O `--insecure` serve os estáticos no servidor local com DEBUG desligado; não
usar esse servidor em produção. Para atualização automática, iniciar também
`npm --prefix frontend run dev`; Vite encaminha API/estáticos ao Django em 8000.

Verificações após instalação autorizada:

```powershell
Push-Location backend
..\.venv\Scripts\python.exe manage.py test tests -v 2
Pop-Location
node --test tests/catalog.test.cjs
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
.\.venv\Scripts\python.exe -m ruff check backend main.py
git diff --check
```

Executar testes Django dentro de `backend/` para evitar colisão com `tests/`
da raiz. Teste focado: nesse diretório, `..\.venv\Scripts\python.exe manage.py
test tests.test_catalog.CatalogApiTests -v 2`; no frontend,
`npm --prefix frontend test -- tests/camera.test.js`. Não aceitar zero testes
como validação. Não adicionar dependências de teste sem autorização.

Segurança, quando as ferramentas estiverem previamente autorizadas e instaladas
no ambiente virtual:

```powershell
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m bandit -r backend -x backend/tests -q
.\.venv\Scripts\python.exe -m pip_audit -r backend/requirements.txt
npm --prefix frontend audit
```

Bandit, Ruff e pip-audit constam de `backend/requirements-dev.txt`. Auditoria
que consulte serviços externos requer autorização. Os overrides de `glob` e
`minimatch` no frontend fixam correções de segurança de ferramentas de teste/lint;
reavaliar com a auditoria e executar testes/lint/build antes de mudá-los.
Revisar o diff para segredos sem imprimir valores encontrados. Auditar também
scripts CDN, que não são cobertos por pip-audit. Registrar verificações ausentes.

## Implementação e validação

- Usar TDD: reproduzir a falha em teste automatizado, observar vermelho pelo
  motivo esperado, implementar a menor correção, observar verde e refatorar.
  Documentação e formatação puras dispensam testes de comportamento.
- Manter Python com quatro espaços, JavaScript/CSS com dois e strings JS com
  aspas duplas, conforme os arquivos. Exemplo: atribuir texto com
  `document.getElementById("cam-name").textContent = product.name;`.
- Preservar IDs de elementos e campos de `PRODUCTS`. Codificar parâmetros com
  `encodeURIComponent`; tratar ID desconhecido e falhas de câmera/modelo.
- Não transformar `page(name)` em leitura de caminho recebido do usuário.
  Usar `textContent` para texto e validar URLs de recursos antes de aceitá-las
  de fontes não confiáveis. Não introduzir HTML dinâmico não sanitizado.
- Para mudanças visuais/AR, verificar catálogo, filtro, diálogo, retorno,
  `/camera?id=classico` e `/ar?id=classico`; testar permissão negada, falta de
  câmera, falha de recurso, gestos e marcadores em dispositivo compatível.
  Câmera real exige teste manual consentido; teste automatizado não o substitui.
- O produto atual usa GLB local; a escala visual não garante dimensões reais.
  Seguir `docs/VALIDACAO.md` para dispositivos reais; mocks não comprovam
  câmera, GPU, reconhecimento de marcadores ou suporte nativo AR.

## Git, revisão e conclusão

- Preservar alterações existentes; revisar status e diff antes de finalizar.
- Usar identificação descritiva do projeto em branches/commits. Por regra global,
  nunca usar `codex`, em qualquer capitalização, nesses nomes ou mensagens.
  Exemplo de branch: `docs/catalogo-ra-politicas`.
- Separar branch, commit e PR por repositório/ente. Antes de abrir PR, verificar
  se já existe um para a branch; título exatamente igual ao nome da branch,
  salvo instrução explícita. Descrever problema, alteração, áreas, validações,
  riscos e rollback, sem dados sensíveis. Após publicação autorizada, confirmar
  sincronização e fornecer o link direto.
- Concluir somente com documentação atualizada, verificações proporcionais
  executadas e sem achados altos/críticos pendentes sem aceitação explícita.
  Informar limitações, testes manuais pendentes e comandos indisponíveis.

## Limites

**Sempre:** preservar dados, histórico e compatibilidade; usar placeholders;
validar entradas/saídas, tratar erros, aplicar menor privilégio e seguir
`SECURITY.md`. Não remover ou afrouxar testes para obter verde.

**Pedir autorização antes:** instalar/adicionar/atualizar dependências; alterar
banco/esquema, autenticação, permissões, infraestrutura ou CI/CD; publicar,
implantar, expor a aplicação por túnel; ações destrutivas; divulgar
vulnerabilidades ou enviar dados a serviços externos.

**Nunca:** expor, registrar ou commitar segredos/dados pessoais; capturar ou
transmitir câmera sem autorização; contornar controles; ocultar falhas;
editar dependências vendorizadas como correção; mudar lógica em tarefa de
formatação; reportar vulnerabilidades inicialmente em canal público.
