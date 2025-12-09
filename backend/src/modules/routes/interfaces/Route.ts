export interface Route {
    id: number;
    name: string;
    vehicleId: number;
    driverId: number;
    startLat: string;
    startLong: string;
    endLat: string;
    endLong: string;
    startTime: string;
    endTime: string | null;
    estimatedDuration: number;
    active: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
