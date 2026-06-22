from .shared.core.query_handler import QueryHandler
from ..infrastructure.mongo_client import transactions_collection

class GetTransactionQueryHandler(QueryHandler):
    def execute(self, transaction_id: str) -> dict:
        transaction = transactions_collection.find_one(
            {'id': transaction_id},
            {'_id': 0}
        )
        return transaction