# Cardápio 3D — protótipo FastAPI

Protótipo simples em Python/FastAPI com visualizador 3D e botão de realidade aumentada usando `<model-viewer>`.

## Requisitos
- Python 3.10 ou superior
- Conexão com a internet (o componente e o modelo 3D são carregados de fontes externas)

## Executar no Windows (PowerShell)

```powershell
cd cardapio3d-fastapi
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Abra `http://127.0.0.1:8000`.

## Executar no macOS/Linux

```bash
cd cardapio3d-fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Abra `http://127.0.0.1:8000`.

## Sobre a realidade aumentada
O modelo usa `ar-modes="webxr scene-viewer quick-look"` e `ar-scale="fixed"`. A disponibilidade depende do aparelho e do navegador. Para testar em um celular, normalmente será necessário abrir a aplicação por HTTPS em um endereço acessível ao celular; o `localhost` do computador não é automaticamente acessível pelo telefone.

O modelo Hamburger.glb é carregado do site de demonstração do model-viewer, portanto precisa de internet. É apenas um modelo de exemplo, não uma representação dimensional garantida de um hambúrguer real.
