import { z } from "zod";
import { vehicleRegistrationSchema } from "../vehicle.schema";

export type VehicleRegistrationDTO = z.infer<typeof vehicleRegistrationSchema>;
