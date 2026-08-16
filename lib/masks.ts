export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export const maskCurrency = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(cleanValue) / 100);
};

export const maskDecimal = (value: string) => {
  return value.replace(/[^\d.,]/g, "").replace(",", ".");
};

// Pra campos de taxa/câmbio digitados livremente (não em cascata de centavos), tipo
// "5,2234" — precisa aceitar precisão além de 2 casas decimais (PTAX real varia nisso)
// e nunca perder o "," que o usuário acabou de digitar entre um render e outro.
export const isValidDecimalInput = (value: string) => /^\d*[.,]?\d*$/.test(value);

export const parseDecimalInput = (value: string) => {
  const num = parseFloat(value.replace(",", "."));
  return isNaN(num) ? 0 : num;
};
