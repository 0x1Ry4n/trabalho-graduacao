import { userRegistrationSchema } from "../user.schema";
import { z } from "zod";

export type UserRegistrationDTO = z.infer<typeof userRegistrationSchema>;

