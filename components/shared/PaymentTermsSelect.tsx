"use client";

import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  CARD_METHOD,
  MAX_CARD_INSTALLMENTS,
  buildPaymentLabel,
  parsePaymentLabel,
} from "@/lib/payment-terms";

interface PaymentTermsSelectProps {
  value: string;
  onChange: (label: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Forma de pagamento + (só no cartão) número de parcelas. Devolve o rótulo
// pronto para gravar/imprimir, ex.: "PIX" ou "CARTÃO CRÉDITO EM 6X".
export function PaymentTermsSelect({ value, onChange, className, style }: PaymentTermsSelectProps) {
  const { method, installments } = parsePaymentLabel(value);
  const isKnown = (PAYMENT_METHODS as readonly string[]).includes(method);

  return (
    <div className="flex gap-2">
      <select
        className={cn(className, "flex-1 min-w-0")}
        style={style}
        value={method}
        onChange={(e) => onChange(buildPaymentLabel(e.target.value, installments))}
      >
        {/* Valor antigo (ex.: "ENTRADA 50%...") que não está na lista padrão */}
        {!isKnown && method && <option value={method}>{method}</option>}
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {method === CARD_METHOD && (
        <select
          aria-label="Parcelas"
          className={cn(className, "w-24 shrink-0")}
          style={style}
          value={installments}
          onChange={(e) => onChange(buildPaymentLabel(CARD_METHOD, Number(e.target.value)))}
        >
          {Array.from({ length: MAX_CARD_INSTALLMENTS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n === 1 ? "À vista" : `${n}x`}</option>
          ))}
        </select>
      )}
    </div>
  );
}
