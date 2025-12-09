export interface Vehicle {
    id: number;
    plate: string;
    model: string;
    capacity: number;
    active: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}