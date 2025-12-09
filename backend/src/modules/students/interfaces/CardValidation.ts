import { CardValidationStatus } from "../../../shared/enums/card-validation-status.enum";

export interface CardValidation {
    id: number;
    studentId: number;
    driverId: number;
    routeId: number;
    validationTime: Date;
    latitude: number | null;
    longitude: number | null;
    status: CardValidationStatus;
    student?: {
        id: number;
        name: string;
        cpf: string;
    };
    driver?: {
        id: number;
        name: string;
        cpf: string;
    };
    route?: {
        id: number;
        name: string;
    };
}
