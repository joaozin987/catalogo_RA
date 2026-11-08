# Food Reconstruction Lab

O primeiro experimento usa `static/images/classico-recorte.png`. O laboratório
envia os bytes da foto ao Hunyuan3D 2.1 local e exibe o GLB experimental ao lado
da imagem de referência. A rotação e o zoom usam o model-viewer já presente no
projeto. As faces ocultas pela foto são inferidas e precisam de revisão humana.

## Rodar localmente

1. Prepare o [ambiente oficial do Hunyuan3D 2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1#install-requirements)
   separadamente, após autorização para instalação e download dos pesos. A
   Tencent informa 29 GB de VRAM para forma e textura juntas no fluxo padrão.
   Verifique a [licença e seus limites territoriais](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE)
   antes de usar ou distribuir o modelo.
2. Na raiz do checkout do Hunyuan3D 2.1, execute o servidor oficial com o
   Python do ambiente de inferência. A integração usa o
   [endpoint `POST /generate`](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/API_DOCUMENTATION.md#available-endpoints).

   ```powershell
   python api_server.py --host 127.0.0.1 --port 8081 --limit-model-concurrency 1
   ```

3. Em outro terminal, na raiz do Catálogo RA, compile o frontend e inicie o
   Django.

   ```powershell
   npm --prefix frontend run build
   $env:FOOD_LAB_ENABLED = "1"
   .\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --insecure
   ```

4. Abra [o laboratório no Django local](http://127.0.0.1:8000/laboratorio-3d).
   Use **Usar PNG do Clássico** ou selecione um PNG/JPEG de até 8 MiB.
   Clique em **Gerar GLB** e mantenha a página aberta durante o processamento.
   O indicador mostra o estado de espera, sem percentual. Compare as vistas e
   baixe o resultado experimental para conservá-lo após fechar a página.

O Django verifica tipo e assinatura do arquivo. A decodificação e a preparação
da imagem acontecem no worker. A chamada local usa semente 42, pede textura
e limita o GLB recebido a 25 MiB. O Django verifica o cabeçalho GLB 2 e a
presença de textura de cor embutida para rejeitar o retorno sem textura que
o worker pode produzir quando a etapa de pintura falha. O limite é de
transferência e não comprova desempenho no celular. O laboratório aceita
uma geração por vez no processo Django. Se a conexão encerrar durante a
inferência, o worker pode continuar a geração. O Django não grava imagens ou
GLBs em disco. O cache do Hunyuan3D pode manter malhas, texturas e logs.

Use somente em loopback, sem proxy reverso, túnel ou exposição à rede. A
integração manda as fotos apenas ao worker local. O navegador carrega o
visualizador pela mesma CDN do catálogo. Para desativar, reinicie o Django
com `FOOD_LAB_ENABLED=0` e encerre o worker.

## Registro do experimento

| Produto | Motor | Estado |
| --- | --- | --- |
| Clássico | Hunyuan3D 2.1 | Integração coberta com resposta simulada. Geração real e avaliação visual pendentes. |

Ao executar com GPU, registre a revisão e os pesos do motor, duração,
tamanho do GLB, dispositivo e tempo de carregamento. Compare a frente com
o PNG e inspecione laterais, topo e traseira com uma volta completa. Avalie
cores, ingredientes, proporções, continuidade da textura e volume. Uma
perda da identidade visual do alimento reprova o resultado. O catálogo
continua usando seu GLB atual. A aprovação persistente e a associação ao
produto pertencem à etapa seguinte.

Hunyuan3D 2.0 e TRELLIS.2 ficam para o comparativo posterior. O primeiro
oferece pipelines separados de malha e textura. O TRELLIS.2 exporta GLB
texturizado e seu guia oficial pede NVIDIA com pelo menos 24 GB, com testes
em Linux. A comparação de qualidade exige executar os modelos sobre as
mesmas imagens. [Hunyuan3D 2.0](https://github.com/Tencent-Hunyuan/Hunyuan3D-2)
· [TRELLIS.2](https://github.com/microsoft/TRELLIS.2)
