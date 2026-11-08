import logging
from subprocess import CalledProcessError, TimeoutExpired  # nosec B404
from threading import Lock

from django.conf import settings
from django.http import Http404, HttpResponse, JsonResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

from catalog.views import frontend
from laboratory.reconstruction import reconstruct

MAX_IMAGE_BYTES = 8 * 1024 * 1024
SIGNATURES = {"image/png": b"\x89PNG\r\n\x1a\n", "image/jpeg": b"\xff\xd8\xff"}
INFERENCE = Lock()
LOGGER = logging.getLogger(__name__)


def require_local_lab(request):
    if not settings.FOOD_LAB_ENABLED or request.META.get("REMOTE_ADDR") not in {
        "127.0.0.1", "::1",
    }:
        raise Http404


@require_safe
@ensure_csrf_cookie
def laboratory(request):
    require_local_lab(request)
    return frontend(request)


@cache_control(no_store=True)
@require_POST
def generate(request):
    require_local_lab(request)
    signature = SIGNATURES.get(request.content_type)
    if signature is None:
        return JsonResponse({"error": "Selecione uma imagem PNG ou JPEG."}, status=415)
    image = request.read(MAX_IMAGE_BYTES + 1)
    if len(image) > MAX_IMAGE_BYTES:
        return JsonResponse({"error": "A imagem deve ter até 8 MiB."}, status=413)
    if not image.startswith(signature):
        return JsonResponse({"error": "O conteúdo não corresponde ao formato da imagem."}, status=400)
    if not INFERENCE.acquire(blocking=False):
        return JsonResponse({"error": "Já há uma geração em andamento."}, status=409)
    try:
        model = reconstruct(image, request.content_type.split("/")[1])
    except (CalledProcessError, ValueError, RecursionError):
        LOGGER.warning("A reconstrução local não retornou um GLB texturizado aceito.")
        return JsonResponse({"error": "A geração falhou ou retornou um GLB sem textura ou acima de 25 MiB."},
                            status=502)
    except TimeoutExpired:
        LOGGER.warning("O Stable Fast 3D excedeu o tempo de espera.")
        return JsonResponse({"error": "A geração excedeu o limite de 10 minutos."}, status=504)
    except OSError:
        LOGGER.warning("O ambiente local do Stable Fast 3D está indisponível.")
        return JsonResponse({"error": "Confira a configuração local do Stable Fast 3D."},
                            status=503)
    finally:
        INFERENCE.release()
    return HttpResponse(model, content_type="model/gltf-binary")
