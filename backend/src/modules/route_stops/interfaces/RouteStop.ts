export interface RouteStop {
    id: number;
    routeId: number;
    stopId: number;
    stopOrder: number;
    estimatedArrival: number;
    createdAt: Date;
    updatedAt: Date;
}
