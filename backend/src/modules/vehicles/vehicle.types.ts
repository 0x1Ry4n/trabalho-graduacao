import { InferInsertModel } from "drizzle-orm";
import { vehiclesTable } from "../../config/db/db.schema";
import { z } from "zod";
import { vehicleListPaginatedSchema } from "./vehicle.schema";
import { Vehicle } from "./interfaces/Vehicle";

export type VehicleInsert = InferInsertModel<typeof vehiclesTable>;
export type VehicleUpdate = Partial<VehicleInsert>;
export type VehicleListPaginatedQuery = z.infer<typeof vehicleListPaginatedSchema>;
export type VehicleFilters = {
    search?: Partial<Vehicle>
}