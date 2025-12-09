import { Vehicle } from "../interfaces/Vehicle";
import { VehicleInsert, VehicleUpdate, VehicleFilters } from "../vehicle.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";

export interface IVehicleRepository {
    findById(id: number, tx?: DbTransaction): Promise<Vehicle | null>;
    findByPlate(plate: string, tx?: DbTransaction): Promise<Vehicle | null>;
    list(tx?: DbTransaction): Promise<Vehicle[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: VehicleFilters, tx?: DbTransaction): Promise<PaginatedDocument<Vehicle> | null>;
    create(data: VehicleInsert, tx?: DbTransaction): Promise<Vehicle>;
    update(id: number, data: VehicleUpdate, tx?: DbTransaction): Promise<Vehicle | null>;
    activate(id: number, tx?: DbTransaction): Promise<void>;
    inactivate(id: number, tx?: DbTransaction): Promise<void>;
    delete(id: number, tx?: DbTransaction): Promise<Vehicle | null>;
}