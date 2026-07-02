from html import escape


def _format_amount(value) -> str:
    try:
        return f"Bs. {float(value):.2f}"
    except (TypeError, ValueError):
        return escape(str(value or "—"))


def render_receipt_html(transaction: dict) -> bytes:
    amount = _format_amount(transaction.get("amount"))
    receipt_hash = escape(str(transaction.get("receipt_hash") or "—"))
    transaction_id = escape(str(transaction.get("id") or "—"))
    customer_ref = escape(str(transaction.get("customer_ref") or "—"))
    created_at = escape(str(transaction.get("created_at") or "—"))
    tenant_id = escape(str(transaction.get("tenant_id") or "—"))

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Comprobante de pago</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #101415;
      color: #e2e8f0;
      padding: 32px 16px;
    }}
    .glow {{
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }}
    .glow::before {{
      content: "";
      position: absolute;
      left: -120px;
      top: -80px;
      width: 288px;
      height: 288px;
      border-radius: 9999px;
      background: rgba(34, 211, 238, 0.1);
      filter: blur(64px);
    }}
    .glow::after {{
      content: "";
      position: absolute;
      right: -90px;
      top: 30%;
      width: 288px;
      height: 288px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.1);
      filter: blur(64px);
    }}
    .shell {{
      position: relative;
      z-index: 1;
      max-width: 640px;
      margin: 0 auto;
      border: 1px solid rgba(71, 85, 105, 0.7);
      border-radius: 24px;
      background: rgba(16, 20, 21, 0.92);
      box-shadow: 0 30px 120px rgba(15, 23, 42, 0.55);
      padding: 28px;
    }}
    .label {{
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #67e8f9;
    }}
    h1 {{
      margin: 12px 0 0;
      font-size: 28px;
      line-height: 1.2;
      color: #f8fafc;
    }}
    .subtitle {{
      margin: 8px 0 0;
      color: #94a3b8;
      font-size: 15px;
    }}
    .amount {{
      margin: 28px 0;
      padding: 20px;
      border-radius: 20px;
      border: 1px solid rgba(34, 211, 238, 0.2);
      background: rgba(34, 211, 238, 0.08);
      text-align: center;
      font-size: 30px;
      font-weight: 700;
      color: #f8fafc;
    }}
    .grid {{
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }}
    .metric {{
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.03);
      padding: 14px;
    }}
    .metric-label {{
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(103, 232, 249, 0.75);
    }}
    .metric-value {{
      margin-top: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      word-break: break-word;
    }}
    .footer {{
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }}
  </style>
</head>
<body>
  <div class="glow"></div>
  <main class="shell">
    <p class="label">Multipagos</p>
    <h1>Comprobante de pago</h1>
    <p class="subtitle">Transacción exitosa</p>

    <div class="amount">{amount}</div>

    <div class="grid">
      <div class="metric">
        <div class="metric-label">Recibo</div>
        <div class="metric-value">{receipt_hash}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Transacción</div>
        <div class="metric-value">{transaction_id}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Referencia</div>
        <div class="metric-value">{customer_ref}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Fecha</div>
        <div class="metric-value">{created_at}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Empresa</div>
        <div class="metric-value">{tenant_id}</div>
      </div>
    </div>

    <div class="footer">
      Comprobante generado electrónicamente.<br />
      Gracias por utilizar Multipagos.
    </div>
  </main>
</body>
</html>
"""

    return html.encode("utf-8")
