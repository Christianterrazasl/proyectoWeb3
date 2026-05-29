import pika
import json
import os


class RabbitMQPublisher:
    """
    Clase encargada de publicar Eventos de Integración hacia RabbitMQ.
    """

    def __init__(self):
        # En desarrollo usaremos localhost, pero lo leemos del .env para cuando usemos Docker
        self.host = os.getenv('RABBITMQ_HOST', 'localhost')

    def publish_payment_completed(self, transaction):
        try:
            # 1. Establecemos conexión con el servidor RabbitMQ
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=self.host))
            channel = connection.channel()

            # 2. Declaramos un 'Exchange' (El megáfono).
            # Tipo 'topic' permite que otros microservicios se suscriban a temas específicos.
            exchange_name = 'multipagos_events'
            channel.exchange_declare(exchange=exchange_name, exchange_type='topic', durable=True)

            # 3. Preparamos el payload (el mensaje que viajará por la red)
            payload = {
                "event_type": "Payment.Completed",
                "data": {
                    "transaction_id": transaction.id,
                    "tenant_id": transaction.tenant_id,
                    "service_id": transaction.service_id,
                    "customer_ref": transaction.customer_ref,
                    "amount": float(transaction.amount)
                }
            }

            # 4. Publicamos el mensaje
            channel.basic_publish(
                exchange=exchange_name,
                routing_key='payment.completed',  # La "etiqueta" del mensaje
                body=json.dumps(payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Hace que el mensaje sea persistente aunque RabbitMQ se reinicie
                )
            )

            print(f"✅ Evento Payment.Completed publicado para {transaction.id}")
            connection.close()

        except Exception as e:
            # Si RabbitMQ está caído, capturamos el error para que el pago no falle de cara al usuario,
            # pero lo registramos. En un sistema real de producción, guardaríamos esto en una base de datos
            # de "eventos fallidos" para reintentarlo luego (Patrón Outbox).
            print(f"⚠️ Advertencia: No se pudo conectar a RabbitMQ. El evento se perdió. Detalles: {e}")