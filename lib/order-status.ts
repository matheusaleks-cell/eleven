// Pedido PAGO/ENTREGUE já é uma venda concluída (arma sai do estoque de verdade).
// PENDENTE/RASCUNHO é só uma reserva (arma tem pedido tirado, mas ainda sem pagamento
// confirmado) — fica "presa" para esse cliente sem contar como vendida.
export function weaponStatusForOrder(status?: string): "VENDIDA" | "RESERVADA" {
  return status === "PENDENTE" || status === "RASCUNHO" ? "RESERVADA" : "VENDIDA";
}
