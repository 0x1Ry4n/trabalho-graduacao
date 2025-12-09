import { z } from "zod";
import { studentRegistrationSchema } from "../student.schema";

export type StudentRegistrationDTO = z.infer<typeof studentRegistrationSchema>

