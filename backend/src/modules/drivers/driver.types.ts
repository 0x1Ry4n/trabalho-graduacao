import { InferInsertModel } from "drizzle-orm";
import { driversTable } from "../../config/db/db.schema";
import { z } from "zod";
import { driverListPaginatedSchema } from "./driver.schema";
import { Driver } from "./interfaces/Driver";

export type DriverInsert = InferInsertModel<typeof driversTable>;
export type DriverUpdate = Partial<DriverInsert>;
export type DriverListPaginatedQuery = z.infer<typeof driverListPaginatedSchema>;
export type DriverFilters = {
    search?: Partial<Driver>
}