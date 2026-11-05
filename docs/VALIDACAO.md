# Validação manual da migração

Os testes automatizados não abrem a câmera real. Registrar dispositivo,
navegador, data e resultado ao executar este roteiro em ambiente autorizado.
Não gravar nem compartilhar imagens da câmera como evidência sem consentimento.

1. Compilar Vue, iniciar Django e abrir `/`. Conferir foto, nome, descrição,
   preço, categorias, abertura/fechamento do diálogo, foco e navegação por teclado.
2. Abrir o produto Clássico. Confirmar carregamento do GLB, rotação, zoom,
   mensagem ao bloquear o modelo e os dois links para a mesa.
3. Em celular com HTTPS autorizado, abrir `/camera?id=classico`, permitir apenas
   câmera e verificar vídeo traseiro, giro, zoom e centralização. Sair, voltar
   e conferir se a indicação de câmera ativa desaparece ao sair.
4. Repetir negando permissão, sem câmera disponível e saindo da página enquanto
   a permissão está pendente. Conferir erro claro e ausência de captura tardia.
5. Com produto de teste com foto e sem GLB, verificar arrastar, pinça, rotação
   por dois dedos e centralização. Não alterar o catálogo operacional para isso.
6. Em `/ar?id=classico`, testar o cartão de `static/marker/marcador.png` e Hiro:
   reconhecimento, perda e retomada, orientação, escala e saída da cena.
   Verificar também o encerramento da câmera durante inicialização da biblioteca.
7. Testar ID ausente/desconhecido: mostrar o primeiro produto como no legado.
   Bloquear API/CDN: mostrar erro e permitir tentar novamente sem iniciar câmera.
8. Verificar Android/WebXR/Scene Viewer e iOS/Quick Look quando disponíveis.
   Registrar limitações do aparelho e ausência de USDZ, sem prometer suporte.

Estado nesta migração: testes automatizados e HTTP local executados; câmera,
marcadores e compatibilidade em celulares reais ainda pendentes de validação.
