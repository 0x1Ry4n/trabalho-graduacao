import { z } from "zod";
import { RoutePeriod } from "../../shared/enums/route-period.enum";

export const studentRouteRegistrationSchema = z.object({
    studentId: z.number().int().positive("ID do estudante invalido"),
    routeStopId: z.number().int().positive("ID da parada da rota invalido"),
    routePeriod: z.enum(RoutePeriod as unknown as [string, ...string[]], { message: "Periodo da rota invalido" }),
    departureTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horario de ida invalido (HH:MM)"),
    returnTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horario de volta invalido (HH:MM)"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de inicio invalida (YYYY-MM-DD)"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de termino invalida (YYYY-MM-DD)").optional(),
    active: z.number().int().min(0).max(1),
});

export const studentRouteUpdateSchema = z.object({
    routeStopId: z.number().int().positive().optional(),
    departureTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    returnTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    active: z.number().int().min(0).max(1).optional(),
});

export const studentRouteListPaginatedSchema = z.object({
    page: z.string().optional().default("1").transform(Number)
        .pipe(z.number().int().positive({ message: "O numero da pagina deve ser um inteiro maior que 0" })),
    pageSize: z.string().optional().default("10").transform(Number)
        .pipe(z.number().int().min(1).max(100, { message: "O tamanho da pagina deve estar entre 1 e 100" })),
    studentId: z.number().int().positive().optional(),
    routeId: z.number().int().positive().optional(),
    routeStopId: z.number().int().positive().optional(),
    routePeriod: z.string().optional(),
    active: z.number().int().optional(),
});
