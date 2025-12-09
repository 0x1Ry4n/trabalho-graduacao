import { z } from "zod";
import { cardValidationRegistrationSchema } from "../student.schema";

export type CardValidationRegistrationDTO = z.infer<typeof cardValidationRegistrationSchema>;