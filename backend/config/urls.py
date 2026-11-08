from django.urls import path

from catalog.views import assets, frontend, products
from laboratory.views import generate, laboratory

urlpatterns = [
    path("api/products", products),
    path("", frontend),
    path("camera", frontend),
    path("ar", frontend),
    path("laboratorio-3d", laboratory),
    path("api/laboratorio-3d/reconstruir", generate),
    # Servidor local do protótipo. Em produção, usar servidor estático dedicado.
    path("assets/<path:path>", assets),
]
