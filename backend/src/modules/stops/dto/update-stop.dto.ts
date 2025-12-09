import { z } from "zod";
import { stopUpdateSchema } from "../stop.schema";

export type UpdateStopDTO = z.infer<typeof stopUpdateSchema>;
