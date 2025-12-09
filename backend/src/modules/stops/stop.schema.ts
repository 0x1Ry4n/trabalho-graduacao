import { z } from "zod";

export const stopRegistrationSchema = z.object({
    name: z.string().min(1).max(150, "O nome da parada não pode ter mais de 150 caracteres"),
    city: z.string().min(1).max(100, "A cidade não pode ter mais de 100 caracteres"),
    neighborhood: z.string().min(1).max(100, "O bairro não pode ter mais de 100 caracteres"),
    address: z.string().min(1).max(200, "O endereço não pode ter mais de 200 caracteres"),
    cep: z.string().min(8).max(15, "O CEP não pode ter mais de 15 caracteres"),
    latitude: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude inválida"),
    longitude: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude inválida"),
});

export const stopUpdateSchema = z.object({
    name: z.string().min(1).max(150).optional(),
    city: z.string().min(1).max(100).optional(),
    neighborhood: z.string().min(1).max(100).optional(),
    address: z.string().min(1).max(200).optional(),
    cep: z.string().min(8).max(15).optional(),
    latitude: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude inválida").optional(),
    longitude: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude inválida").optional(),
});

export const stopListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number)
        .pipe(z.number().int().positive({ message: 'O número da página deve ser um inteiro maior que 0' })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, { message: 'O tamanho da página deve estar entre 1 e 100' })),
    id: z.number().int().positive().optional(),
    name: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
});
