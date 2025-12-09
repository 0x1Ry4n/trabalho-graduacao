import { z } from "zod";
import { driverUpdateSchema } from "../driver.schema";

export type UpdateDriverDTO = z.infer<typeof driverUpdateSchema>; 