import { z } from "zod";

export const routeStopRegistrationSchema = z.object({
    routeId: z.number().int().positive("ID da rota inválido"),
    stopId: z.number().int().positive("ID da parada inválido"),
    stopOrder: z.number().int().min(1, "A ordem da parada deve ser maior que 0"),
    estimatedArrival: z.number().int().min(0, "O tempo estimado de chegada não pode ser negativo"),
});

export const routeStopUpdateSchema = z.object({
    stopOrder: z.number().int().min(1).optional(),
    estimatedArrival: z.number().int().min(0).optional(),
});

export const routeStopListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number)
        .pipe(z.number().int().positive({ message: 'O número da página deve ser um inteiro maior que 0' })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, { message: 'O tamanho da página deve estar entre 1 e 100' })),
    routeId: z.number().int().positive().optional(),
    stopId: z.number().int().positive().optional(),
});
