import json
from pathlib import Path, PurePosixPath

from django.conf import settings
from django.http import Http404, HttpResponse, JsonResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_safe
from django.views.static import serve


@cache_control(no_store=True)
@require_safe
def products(request):
    data = json.loads(Path(__file__).with_name("products.json").read_text(encoding="utf-8"))
    return JsonResponse(data, safe=False, json_dumps_params={"ensure_ascii": False})


@cache_control(no_store=True)
@require_safe
def frontend(request):
    try:
        html = settings.FRONTEND_INDEX.read_text(encoding="utf-8")
    except FileNotFoundError:
        return HttpResponse("Frontend não compilado. Execute npm run build em frontend/.", status=503)
    return HttpResponse(html)


@require_safe
def assets(request, path):
    if ".." in PurePosixPath(path).parts or "\\" in path:
        raise Http404
    return serve(request, path, document_root=settings.FRONTEND_ASSETS)
