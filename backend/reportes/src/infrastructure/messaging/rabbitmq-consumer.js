import amqp from "amqplib";
import { RegisterAuditLogHandler } from "../../application/handlers/RegisterAuditLogHandler.js";

const EXCHANGE = "multipagos_events";
const QUEUE = "reportes.payment_completed";
const ROUTING_KEY = "payment.completed";

export async function startPaymentCompletedConsumer() {
  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const url = process.env.RABBITMQ_URL || `amqp://guest:guest@${host}:5672`;
  const handler = new RegisterAuditLogHandler();

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  channel.consume(QUEUE, async (message) => {
    if (!message) return;

    try {
      const payload = JSON.parse(message.content.toString());

      if (payload?.event_type === "Payment.Completed") {
        const data = payload.data || {};
        await handler.execute({
          action: "payment.completed",
          actorUserId: null,
          actorEmail: "system@multipagos",
          companyId: data.tenant_id ?? null,
          resourceType: "transaction",
          resourceId: data.transaction_id ?? null,
          metadata: data,
        });
        console.log(
          `[reportes-consumer] Payment.Completed audit → ${data.transaction_id}`,
        );
      }

      channel.ack(message);
    } catch (error) {
      console.error("[reportes-consumer] Error:", error);
      channel.nack(message, false, false);
    }
  });

  console.log(`[reportes-consumer] Escuchando ${ROUTING_KEY} en ${QUEUE}`);
}
