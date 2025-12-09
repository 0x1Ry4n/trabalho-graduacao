import { z } from "zod";
import { driverRegistrationSchema } from "../driver.schema";

export type DriverRegistrationDTO = z.infer<typeof driverRegistrationSchema>;
