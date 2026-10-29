// Condição de pagamento do pedido. O rótulo é o texto gravado em
// SalesOrder.paymentMethod (ex.: "PIX", "CARTÃO CRÉDITO EM 6X"), então o
// parcelamento sobrevive à reimpressão do PDF sem precisar de coluna nova.

export const PAYMENT_METHODS = [
  "PIX",
  "CARTÃO CRÉDITO",
  "BOLETO",
  "DINHEIRO",
  "TRANSFERÊNCIA",
  "CHEQUE",
] as const;

export const CARD_METHOD = "CARTÃO CRÉDITO";
export const MAX_CARD_INSTALLMENTS = 12;

export function buildPaymentLabel(method: string, installments = 1): string {
  return method === CARD_METHOD && installments > 1
    ? `${CARD_METHOD} EM ${installments}X`
    : method;
}

export function parsePaymentLabel(label?: string | null) {
  const raw = (label || "").trim();
  const text = raw.toUpperCase();

  // Pedidos antigos gravaram "ENTRADA 50% DO VALOR - RESTANTE EM 6X NO CARTÃO..."
  // e continuam sendo impressos com Entrada/Saldo.
  const hasDownPayment = text.includes("ENTRADA");
  const isCard = text.includes("CART") && !hasDownPayment;

  const match = isCard ? text.match(/(\d{1,2})\s*X/) : null;
  const installments = match
    ? Math.min(Math.max(parseInt(match[1], 10), 1), MAX_CARD_INSTALLMENTS)
    : 1;

  return {
    method: isCard ? CARD_METHOD : raw,
    installments,
    isCard,
    hasDownPayment,
  };
}
