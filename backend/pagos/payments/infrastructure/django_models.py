from django.db import models

class TransactionModel(models.Model):
    """
    Entidad de Infraestructura (TypeORM equivalente en Django).
    Esta es la fuente de la verdad absoluta que se guardará en PostgreSQL.
    """
    id = models.CharField(max_length=50, primary_key=True)
    debt_id = models.IntegerField(null=True, blank=True)
    tenant_id = models.CharField(max_length=50)
    service_id = models.CharField(max_length=50)
    customer_ref = models.CharField(max_length=150)
    # Usamos DecimalField para el dinero, es mucho más seguro que Float en bases de datos relacionales
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField()
    receipt_hash = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'transactions' # Nombre exacto de la tabla en Postgres
