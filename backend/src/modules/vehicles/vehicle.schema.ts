import { z } from "zod";
import { VehicleCategory } from "../../shared/enums/vehicle-category.enum";

export const vehicleRegistrationSchema = z.object({
    plate: z.string().min(1).max(10, "O número da placa não pode ter mais de 10 caracteres"),
    model: z.string().min(1).max(50, "O modelo do veículo não pode ter mais de 50 caracteres"),
    type: z.enum(VehicleCategory),
    notes: z.string().max(1000, "A observação não pode ter mais de 1000 caracteres").optional(),
    capacity: z.number().int().positive(),
    active: z.number().int().min(0).max(1).positive(),
});

export const vehicleUpdateSchema = z.object({
    plate: z.string().min(1).max(10, "O número da placa não pode ter mais de 10 caracteres").optional(),
    notes: z.string().max(1000, "A observação não pode ter mais de 1000 caracteres").optional(),
    capacity: z.number().int().positive().optional(),
    active: z.number().int().min(0).max(1).positive().optional(),
});

export const vehicleListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number).
        pipe(z.number().int().positive({
            message: 'O número da página deve ser um inteiro maior que 0'
        })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, {
            message: 'O tamanho da página deve estar entre 1 e 100'
        })),
    id: z.number().int().positive(),
    plate: z.string(),
    model: z.string(),
    type: z.string(),
    notes: z.string().nullable(),
    capacity: z.number().int().positive(),
    active: z.number().int(),
});




