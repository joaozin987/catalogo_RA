# Food Reconstruction Lab

O primeiro experimento usa `static/images/classico-recorte.png`. O laboratório
passa a foto ao Stable Fast 3D local e exibe o GLB experimental ao lado
da imagem de referência. A rotação e o zoom usam o model-viewer já presente no
projeto. As faces ocultas pela foto são inferidas e precisam de revisão humana.

## Rodar localmente

1. Prepare um checkout confiável e um ambiente separado seguindo o
   [guia oficial do Stable Fast 3D](https://github.com/Stability-AI/stable-fast-3d#getting-started).
   O fabricante indica cerca de 6 GB de VRAM no fluxo padrão com GPU para
   uma imagem e documenta CPU. O suporte ao Windows é experimental.
   A instalação e o download dependem da autorização prevista no projeto.
2. Aceite os termos no [repositório oficial de pesos](https://huggingface.co/stabilityai/stable-fast-3d)
   e coloque `config.yaml` e `model.safetensors` no mesmo diretório local.
   Antes de abrir o laboratório, rode o CLI uma vez no ambiente separado
   com a imagem de demonstração oficial para preparar o cache do removedor
   de fundo e confirmar que o motor exporta `0/mesh.glb`.

   ```powershell
   $env:SF3D_USE_CPU = "1"
   python run.py demo_files/examples/chair1.png --device cpu --pretrained-model C:/caminho/pesos-sf3d --output-dir output
   ```

3. Na raiz do Catálogo RA, configure os caminhos absolutos para o checkout,
   o Python do ambiente de inferência e os pesos. Use `cpu` para este
   computador ou `cuda` em uma máquina com PyTorch e NVIDIA compatíveis.

   ```powershell
   npm --prefix frontend run build
   $env:FOOD_LAB_ENABLED = "1"
   $env:FOOD_LAB_SF3D_DIR = "C:/caminho/stable-fast-3d"
   $env:FOOD_LAB_SF3D_PYTHON = "C:/caminho/ambiente-sf3d/Scripts/python.exe"
   $env:FOOD_LAB_SF3D_WEIGHTS = "C:/caminho/pesos-sf3d"
   $env:FOOD_LAB_SF3D_DEVICE = "cpu"
   .\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --insecure
   ```

4. Abra [o laboratório no Django local](http://127.0.0.1:8000/laboratorio-3d).
   Use **Usar PNG do Clássico** ou selecione um PNG/JPEG de até 8 MiB.
   Clique em **Gerar GLB** e mantenha a página aberta durante o processamento.
   O indicador mostra o estado de espera, sem percentual. Compare as vistas e
   baixe o resultado experimental para conservá-lo após fechar a página.

O Django verifica tipo e assinatura do arquivo. A decodificação e a preparação
da imagem acontecem no CLI oficial. A integração usa o atlas padrão de
1024 pixels e limita o GLB a 25 MiB. O Django verifica o cabeçalho GLB 2 e a
presença de textura de cor embutida. O limite é de
transferência e não comprova desempenho no celular. O laboratório aceita
uma geração por vez no processo Django e encerra o CLI após 10 minutos.
Se a conexão encerrar antes, o processo pode continuar até concluir ou
atingir o limite. A imagem e a saída ficam em um diretório temporário
removido ao fim da requisição. Uma interrupção abrupta do servidor pode
deixar arquivos temporários para limpeza posterior.

Use somente em loopback, sem proxy reverso, túnel ou exposição à rede. A
integração passa as fotos ao CLI local. O navegador carrega o
visualizador pela mesma CDN do catálogo. Para desativar, reinicie o Django
com `FOOD_LAB_ENABLED=0`.

## Registro do experimento

| Produto | Motor | Estado |
| --- | --- | --- |
| Clássico | Stable Fast 3D | Integração coberta com exportação simulada. Geração real e avaliação visual pendentes. |

Ao executar, registre o dispositivo de inferência, a revisão e os pesos do motor, duração,
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
