import { z } from "zod";
import { studentRouteUpdateSchema } from "../student-route.schema";

export type UpdateStudentRouteDTO = z.infer<typeof studentRouteUpdateSchema>;
