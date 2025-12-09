import { RoutePeriod } from "../../../shared/enums/route-period.enum";

export interface StudentRoute {
    id: number;
    studentId: number;
    routeStopId: number;
    routePeriod: RoutePeriod;
    departureTime: string;
    returnTime: string;
    startDate: string;
    endDate: string | null;
    active: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
