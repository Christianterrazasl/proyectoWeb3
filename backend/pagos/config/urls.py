from django.contrib import admin
from django.urls import path, include  # <-- ¡Asegúrate de que 'include' esté aquí!

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('payments.api.urls')),  # <-- ¡Y que esta línea no tenga un # al principio!
]