import { z } from "zod";
import { enrollmentRegistrationSchema } from "../enrollment.schema";

export type CreateEnrollmentDTO = z.infer<typeof enrollmentRegistrationSchema>;