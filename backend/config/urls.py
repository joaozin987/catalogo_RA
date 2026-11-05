from django.urls import path

from catalog.views import assets, frontend, products

urlpatterns = [
    path("api/products", products),
    path("", frontend),
    path("camera", frontend),
    path("ar", frontend),
    # Servidor local do protótipo. Em produção, usar servidor estático dedicado.
    path("assets/<path:path>", assets),
]
