const amqp = require("amqplib");

const EXCHANGE = "multipagos_events";
const QUEUE = "deudas.payment_completed";
const ROUTING_KEY = "payment.completed";

async function markDebtsAsPaid(prismaClient, payload) {
  const data = payload?.data || {};
  const tenantId = String(data.tenant_id || "");
  const serviceId = String(data.service_id || "");
  const customerRef = String(data.customer_ref || "");

  if (!tenantId || !serviceId || !customerRef) {
    console.warn("[deudas-consumer] Evento incompleto, se omite:", payload);
    return;
  }

  const result = await prismaClient.debt.updateMany({
    where: {
      tenant_id: tenantId,
      service_id: serviceId,
      customer_ref: customerRef,
      status: "PENDING",
    },
    data: { status: "PAID" },
  });

  console.log(
    `[deudas-consumer] Payment.Completed → ${result.count} deuda(s) marcada(s) PAID (${tenantId}/${serviceId}/${customerRef})`,
  );
}

async function startPaymentCompletedConsumer(prismaClient) {
  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const url = process.env.RABBITMQ_URL || `amqp://guest:guest@${host}:5672`;

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
        await markDebtsAsPaid(prismaClient, payload);
      }
      channel.ack(message);
    } catch (error) {
      console.error("[deudas-consumer] Error procesando mensaje:", error);
      channel.nack(message, false, false);
    }
  });

  console.log(`[deudas-consumer] Escuchando ${ROUTING_KEY} en ${QUEUE}`);
}

module.exports = { startPaymentCompletedConsumer, markDebtsAsPaid };
