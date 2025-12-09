import { PayerType } from "../../../shared/enums/payer-type.enum";

export interface Payer {
    id: number;
    type: PayerType;
    studentId: number | null;
    companyName: string | null;
}