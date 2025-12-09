import { z } from "zod";
import { enrollmentUpdateSchema } from "../enrollment.schema";

export type UpdateEnrollmentDTO = z.infer<typeof enrollmentUpdateSchema>;