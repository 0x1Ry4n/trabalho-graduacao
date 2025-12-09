import { z } from "zod";
import { stopRegistrationSchema } from "../stop.schema";

export type CreateStopDTO = z.infer<typeof stopRegistrationSchema>;
