/** Mantem apenas os digitos de um documento mascarado (CPF, CNPJ, telefone). */
export function onlyDigits(value: string): string {
    return value.replace(/\D/g, "");
}

/**
 * Valida um CPF pelos digitos verificadores.
 *
 * `RegexPatterns.cpfRegex` confere apenas o formato, entao um numero como
 * `464.231.316-49` passa por ele e so e recusado la no gateway — que responde
 * `Invalid taxId` e devolve um 502 opaco para o aluno. A checagem aqui permite
 * barrar o documento antes da chamada externa.
 */
export function isValidCpf(value: string): boolean {
    const digits = onlyDigits(value);

    // Repeticoes (00000000000, 11111111111, ...) satisfazem o calculo dos
    // digitos verificadores, mas nao sao CPFs validos.
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    for (const length of [9, 10]) {
        let sum = 0;

        for (let i = 0; i < length; i++) {
            sum += Number(digits[i]) * (length + 1 - i);
        }

        if (((sum * 10) % 11) % 10 !== Number(digits[length])) return false;
    }

    return true;
}
