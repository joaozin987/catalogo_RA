# Política de segurança — catalogo_RA

## Objetivo, escopo e suporte

Esta política cobre o cardápio Django/Vue e o legado FastAPI preservado, templates, JavaScript,
recursos estáticos, dependências e integrações de câmera/realidade aumentada.
O projeto não possui releases ou tags versionadas no checkout analisado.

| Linha | Tratamento de segurança |
| --- | --- |
| Estado atual da branch `main` | Linha para triagem e correções do protótipo |
| Commits antigos, forks e cópias sem manutenção | Sem suporte; atualizar para a linha mantida |

Python 3.10+ é o requisito declarado, não uma garantia de testes em todas as
versões; utilizar runtime ainda mantido. A migração fixa Django e dependências
de execução em `backend/requirements.txt`; o frontend possui versões exatas e
lockfile npm, com overrides para correções das ferramentas de desenvolvimento.
Os arquivos Python não possuem hashes e as dependências transitivas de
desenvolvimento não estão integralmente fixadas. FastAPI e Uvicorn legados
continuam com limites mínimos em `requirements.txt`. O protótipo não possui garantia
de adequação à produção ou atendimento contínuo.

## Reportar de forma privada

No [repositório](https://github.com/joaozin987/catalogo_RA), use **Security →
Report a vulnerability**, caso o GitHub Private Vulnerability Reporting esteja
habilitado. A disponibilidade desse recurso não foi verificada.

Se a opção não estiver disponível, obtenha um canal privado com o responsável
pelo repositório antes de compartilhar detalhes. Ainda não há e-mail de
segurança ou contato privado alternativo documentado. Cabe ao responsável
habilitar o reporte privado ou documentar esse contato antes de disponibilizar
o projeto publicamente para uso operacional. Não envie o relato inicial por
issue, PR, discussão, chat público ou rede social.

Inclua commit/versão, rota ou componente afetado, navegador e sistema quando
relevantes, descrição, impacto, passos mínimos de reprodução e contato para
retorno. Remova credenciais, dados pessoais e imagens de pessoas das evidências.
Não é necessário explorar o problema nem publicar uma prova. Não provoque
indisponibilidade, acesso persistente, alteração de dados ou exfiltração.

## Triagem, resposta e divulgação

A meta de atendimento é confirmar recebimento em até **5 dias úteis** e
informar andamento ao menos a cada **10 dias úteis**, conforme disponibilidade
dos mantenedores; não constitui SLA contratado.

Os mantenedores devem confirmar o problema em ambiente isolado, avaliar alcance
e severidade, definir mitigação/correção e validar testes de regressão. Achados
altos ou críticos bloqueiam a entrega até correção ou aceitação explícita do
risco pelo responsável. Havendo exposição de credenciais, revogar/rotacionar e
avaliar o impacto sem reproduzir valores em logs ou documentos.

A divulgação deve ser coordenada após correção ou mitigação, com autorização
do responsável, descrição das versões afetadas e orientação de atualização.
Oferecer crédito ao relator apenas com consentimento e sem identificação
involuntária. Não publicar detalhes exploráveis antes da coordenação.

## Configuração e uso seguro

- Executar desenvolvimento em `127.0.0.1`; `--reload` é destinado ao ambiente
  local. Publicação, túneis e infraestrutura exigem autorização prévia.
  Usar HTTPS em acesso remoto, especialmente para câmera/WebXR.
- Django mantém DEBUG desligado e hosts locais por padrão. Seu `runserver
  --insecure` serve estáticos apenas para validação local; não usar em produção.
  Sem `DJANGO_SECRET_KEY` no ambiente, gera chave efêmera no processo, adequada
  somente ao protótipo sem sessões. Produção exige chave estável e configuração
  de segurança próprias, mediante autorização; não commitar valores.
- `/api/products` aceita apenas GET/HEAD, sem banco ou escrita. O proxy local
  do Vite encaminha somente `/api` e `/static`, sem abrir CORS global.
- `/`, `/camera`, `/ar` e `/static` são acessíveis sem autenticação. Não colocar
  documentos privados, credenciais ou arquivos pessoais em `static/`; tudo
  nessa árvore pode ser servido. Não adicionar operações administrativas sem
  revisão de autenticação/autorização previamente autorizada.
- Manter os nomes de templates definidos pelo código. `page(name)` lê arquivos
  diretamente e não deve receber caminhos fornecidos pelo cliente.
- Solicitar câmera apenas para a função escolhida pelo usuário. A implementação
  própria de `/camera` solicita vídeo com `audio: false`, interrompe as tracks
  em `pagehide` e na desmontagem Vue, e libera streams que chegam após a saída;
  `/ar` depende de AR.js e possui limpeza própria de cena/vídeo. Revisar
  separadamente ambas as rotas, inclusive inicialização assíncrona de terceiros.
  Não gravar, transmitir ou registrar frames, áudio, biometria ou localização
  sem autorização explícita e análise de privacidade.
- O código próprio não implementa upload de câmera, mas scripts externos
  executam no contexto da página. Não prometer ausência de coleta por terceiros
  sem revisão dessas dependências. Evitar dados pessoais também nos logs HTTP.
- Templates carregam model-viewer do Google, A-Frame e AR.js via CDN. Revisar
  procedência, versões e mudanças antes de atualizar; referências versionadas
  não substituem verificação de integridade. Recursos externos geram conexões
  aos provedores. Não acrescentar terceiros sem autorização.
- Preferir modelos/imagens locais revisados. O catálogo atual utiliza GLB local;
  `products.js` também contém constantes de modelos de demonstração externos.
  Validar protocolo/origem, tamanho e formato de novos recursos; não aceitar
  URLs ou HTML arbitrários de entrada não confiável.
- Habilitar o laboratório 3D apenas em loopback, em máquina de uso confiável.
  O Django usa CSRF e encaminha imagens de até 8 MiB somente à API local
  Hunyuan3D em `127.0.0.1:8081`. O worker roda em ambiente separado, pode
  persistir artefatos no cache próprio e deve receber apenas imagens autorizadas.
  O [roteiro do laboratório](docs/LABORATORIO-3D.md) registra os limites.
- Manter segredos fora de código, testes, logs e commits. `.env` e `.venv/`
  estão ignorados, o que não protege arquivos já rastreados. Usar placeholders
  nos exemplos e menor privilégio em credenciais e processos.
- Antes de produção, revisar TLS, cabeçalhos (incluindo CSP e permissões de
  câmera compatíveis com AR), restrições de rede, dependências, alertas e logs.
  Essas proteções não estão comprovadas apenas pela presença desta política.

## Responsabilidades e pendências

O responsável pelo repositório `joaozin987/catalogo_RA` deve designar o contato
privado, receber relatos, coordenar correções e atualizar esta política.
Contribuidores devem preservar os controles, seguir `AGENTS.md` e comunicar
riscos de forma privada. Operadores são responsáveis por configuração segura,
atualização e autorização de câmera no ambiente em que executam o protótipo.

Há testes Django, Vitest e caracterização com Node, lint Ruff/ESLint e comandos
Bandit/pip-audit/npm audit documentados. Eles não substituem revisão manual das
CDNs ou teste de câmera real. Não há CI ou varredura automatizada de segredos
configurados no checkout. Proteções de branch, revisão obrigatória, alertas e
reporte privado do GitHub não foram verificados remotamente. Recomenda-se
avaliar sua adoção, pinagem verificável de dependências e licença explícita;
alterações de dependências, permissões e CI/CD exigem autorização.

## Histórico de avisos

Nenhum aviso de segurança está documentado neste checkout. Isso não comprova
ausência de vulnerabilidades. Registrar avisos coordenados em
[GitHub Security Advisories](https://github.com/joaozin987/catalogo_RA/security/advisories)
quando disponíveis e atualizar esta seção com os links publicados.
