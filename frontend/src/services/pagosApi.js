const PAYMENTS_API_BASE = import.meta.env.VITE_PAYMENTS_API_URL || "/api/payments";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

export async function createPaymentQr({ tenant_id, service_id, customer_ref, amount }) {
  const response = await fetch(`${PAYMENTS_API_BASE}/qr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id,
      service_id,
      customer_ref,
      amount,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo generar el QR de pago");
  }

  return data;
}

export async function confirmPayment({ transaction_id, action = "APPROVE" }) {
  const response = await fetch(`${PAYMENTS_API_BASE}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id, action }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo confirmar el pago");
  }

  return data;
}

export async function getPayment(transaction_id) {
  const response = await fetch(`${PAYMENTS_API_BASE}/${transaction_id}`);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo consultar el pago");
  }

  return data?.data ?? data;
}

export function getReceiptUrl(transaction_id) {
  return `${PAYMENTS_API_BASE}/${transaction_id}/receipt`;
}
