import { z } from "zod";

export const routeRegistrationSchema = z.object({
    name: z.string().min(1).max(150, "O nome da rota não pode ter mais de 150 caracteres"),
    vehicleId: z.number().int().positive("ID do veículo inválido"),
    driverId: z.number().int().positive("ID do motorista inválido"),
    startLat: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude inicial inválida"),
    startLong: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude inicial inválida"),
    endLat: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude final inválida"),
    endLong: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude final inválida"),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário de início inválido (HH:MM)"),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário de fim inválido (HH:MM)").optional(),
    estimatedDuration: z.number().int().positive("Duração estimada deve ser positiva"),
    active: z.number().int().min(0).max(1),
});

export const routeUpdateSchema = z.object({
    name: z.string().min(1).max(150).optional(),
    vehicleId: z.number().int().positive().optional(),
    driverId: z.number().int().positive().optional(),
    startLat: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude inválida").optional(),
    startLong: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude inválida").optional(),
    endLat: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude inválida").optional(),
    endLong: z.string().regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude inválida").optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    estimatedDuration: z.number().int().positive().optional(),
    active: z.number().int().min(0).max(1).optional(),
});

export const routeListPaginatedSchema = z.object({
    page: z.string().optional().default('1').transform(Number)
        .pipe(z.number().int().positive({ message: 'O número da página deve ser um inteiro maior que 0' })),
    pageSize: z.string().optional().default('10').transform(Number)
        .pipe(z.number().int().min(1).max(100, { message: 'O tamanho da página deve estar entre 1 e 100' })),
    id: z.number().int().positive().optional(),
    name: z.string().optional(),
    vehicleId: z.number().int().positive().optional(),
    driverId: z.number().int().positive().optional(),
    active: z.number().int().optional(),
});

export const addStopToRouteSchema = z.object({
    stopId: z.number().int().positive("ID da parada inválido"),
    stopOrder: z.number().int().min(0, "Ordem deve ser maior ou igual a 0"),
    estimatedArrival: z.number().int().min(0, "Tempo estimado deve ser maior ou igual a 0"),
});

export const updateStopOrderSchema = z.object({
    stopOrder: z.number().int().min(0, "Ordem deve ser maior ou igual a 0"),
    estimatedArrival: z.number().int().min(0, "Tempo estimado deve ser maior ou igual a 0"),
});
