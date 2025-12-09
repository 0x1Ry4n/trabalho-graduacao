import { z } from "zod";
import { studentRouteRegistrationSchema } from "../student-route.schema";

export type CreateStudentRouteDTO = z.infer<typeof studentRouteRegistrationSchema>;
