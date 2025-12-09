const onlyDigits = (v: string) => v.replace(/\D/g, '');

export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskRG(value: string): string {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

export function maskTime(value: string): string {
  const d = onlyDigits(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function maskCurrency(value: string): string {
  const d = onlyDigits(value);
  if (!d) return '';
  const num = parseInt(d, 10);
  const formatted = (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R$ ${formatted}`;
}

export function maskPlate(value: string): string {
  const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (v.length <= 3) return v;
  return `${v.slice(0, 3)}-${v.slice(3)}`;
}

export function maskNumeric(value: string, maxLength = 10): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);

  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCPF(value: string): string {
  const numbers = (value || '').replace(/\D/g, '').slice(0, 11);

  return numbers
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatPhone(value: string): string {
  const numbers = (value || '').replace(/\D/g, '');

  if (numbers.length <= 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').trim();
  }

  return numbers.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').trim();
}

export function formatRG(rg: string | undefined | null): string | undefined {
  if (!rg) return undefined;
  const unmasked = rg.replace(/\D/g, '');
  if (unmasked.length !== 9) return rg;
  return `${unmasked.slice(0, 2)}.${unmasked.slice(2, 5)}.${unmasked.slice(5, 8)}-${unmasked.slice(8)}`;
}

export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

export function unmaskCurrency(value: string): number {
  const d = onlyDigits(value);
  return parseInt(d, 10) / 100;
}
