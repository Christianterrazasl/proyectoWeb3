from ..infrastructure.mongo_client import transactions_collection

class GetTransactionQueryHandler:
    """
    Query de CQRS: Obtener el estado de una transacción.
    Va directo a la vista proyectada en MongoDB, saltándose Postgres y el Dominio.
    """
    def execute(self, transaction_id: str) -> dict:
        # Buscamos en Mongo y excluimos el campo interno '_id' que genera Mongo por defecto
        # para que no rompa la serialización del JSON en Django.
        transaction = transactions_collection.find_one(
            {'id': transaction_id},
            {'_id': 0}
        )
        return transaction