import { z } from "zod";
import { DriverContractType } from "../../shared/enums/driver-contract-type.enum";
import { RegexPatterns } from "../../shared/utils/regex.utils";

export const driverRegistrationSchema = z.object({
    userId: z.number().int().positive(),
    name: z.string().trim().min(8, "O nome do motorista deve ter pelo menos 8 caracteres").max(150, "O nome do motorista não pode ter mais de 150 caracteres"),
    motherName: z.string().trim().min(8, "O nome da mãe deve ter pelo menos 8 caracteres").max(150, "O nome da mãe não pode ter mais de 150 caracteres"),
    cpf: z.string().max(15, "O CPF não pode ter mais de 15 caracteres").regex(RegexPatterns.cpfRegex, "CPF inválido"),
    cnpj: z.string().max(18, "O CNPJ não pode ter mais de 18 caracteres").regex(RegexPatterns.cnpjRegex, "CNPJ inválido").optional(),
    rg: z.string().max(11, "O RG não pode ter mais de 11 caracteres").regex(RegexPatterns.rgRegex, "RG inválido"),
    birthDate: z.coerce.date().transform(date =>
        date.toISOString().split("T")[0]
    ),
    licenseNumber: z.string().max(11, "A CNH não pode ter mais de 11 caracteres").regex(RegexPatterns.cnhRegex, "CNH inválida"),
    phone: z.string().max(20, "O telefone não pode ter mais de 20 caracteres").optional(),
    email: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres").optional(),
    city: z.string().max(100, "O nome da cidade não pode ter mais de 100 caracteres"),
    neighborhood: z.string().max(100, "O nome do bairro não pode ter mais de 100 caracteres"),
    address: z.string().max(200, "O endereço não pode ter mais de 200 caracteres"),
    cep: z.string().max(15, "O cep não pode ter mais de 15 caracteres").regex(RegexPatterns.cepRegex, "CEP inválido"),
    companyName: z.string().max(150, "O nome da compania não pode ter mais de 150 caracteres").optional(),
    contractType: z.enum(DriverContractType),
    salary: z.coerce.number().positive().max(99999999.99).transform(salary => salary.toString()),
    admissionDate: z.coerce.date().transform(date =>
        date.toISOString().split("T")[0]
    ),
    rescissionDate: z.coerce.date().optional().transform(date => date ? date.toISOString().split("T")[0] : null),
    photoUrl: z.url().max(255).optional(),
    residenceProofUrl: z.url().max(255).optional(),
});

export const driverUpdateSchema = z.object({
    name: z.string().trim().min(8, "O nome do motorista deve ter pelo menos 8 caracteres").max(150, "O nome do motorista não pode ter mais de 150 caracteres").optional(),
    cpf: z.string().max(15, "O CPF não pode ter mais de 15 caracteres").regex(RegexPatterns.cpfRegex, "CPF inválido").optional(),
    cnpj: z.string().max(18, "O CNPJ não pode ter mais de 18 caracteres").regex(RegexPatterns.cnpjRegex, "CNPJ inválido").optional(),
    rg: z.string().max(11, "O RG não pode ter mais de 11 caracteres").regex(RegexPatterns.rgRegex, "RG inválido").optional(),
    birthDate: z.coerce.date().transform(date =>
        date.toISOString().split("T")[0]
    ).optional(),
    licenseNumber: z.string().max(11, "A CNH não pode ter mais de 11 caracteres").regex(RegexPatterns.cnhRegex, "CNH inválida").optional(),
    phone: z.string().max(20, "O telefone não pode ter mais de 20 caracteres").optional(),
    email: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres").optional(),
    city: z.string().max(100, "O nome da cidade não pode ter mais de 100 caracteres").optional(),
    neighborhood: z.string().max(100, "O nome do bairro não pode ter mais de 100 caracteres").optional(),
    address: z.string().max(200, "O endereço não pode ter mais de 200 caracteres").optional(),
    cep: z.string().max(15, "O cep não pode ter mais de 15 caracteres").regex(RegexPatterns.cepRegex, "CEP inválido").optional(),
    companyName: z.string().max(150, "O nome da compania não pode ter mais de 150 caracteres").optional(),
    contractType: z.enum(DriverContractType).optional(),
    salary: z.coerce.number().positive().max(99999999.99).optional()
        .transform(salary => salary?.toString()),
    admissionDate: z.coerce.date().optional()
        .transform(admissionDate => admissionDate?.toString()),
    rescissionDate: z.coerce.date().optional()
        .transform(rescissionDate => rescissionDate?.toString()),
    photoUrl: z.url().max(255).optional(),
    residenceProofUrl: z.url().max(255).optional(),
});

export const driverListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    userId: z.number().int().positive(),
    name: z.string(),
    motherName: z.string(),
    cpf: z.string(),
    cnpj: z.string().nullable(),
    rg: z.string(),
    birthDate: z.coerce.date().transform(date =>
        date.toISOString().split("T")[0]
    ),
    licenseNumber: z.string(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    city: z.string(),
    neighborhood: z.string(),
    address: z.string(),
    cep: z.string(),
    companyName: z.string().nullable(),
    contractType: z.enum(DriverContractType),
    salary: z.coerce.number().positive(),
    admissionDate: z.coerce.date(),
    rescissionDate: z.coerce.date().optional().nullable(),
    photoUrl: z.string().nullable(),
    residenceProofUrl: z.url().max(255).nullable(),
});