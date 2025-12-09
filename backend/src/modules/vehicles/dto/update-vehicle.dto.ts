import { z } from "zod";
import { vehicleUpdateSchema } from "../vehicle.schema";

export type UpdateVehicleDTO = z.infer<typeof vehicleUpdateSchema>;
