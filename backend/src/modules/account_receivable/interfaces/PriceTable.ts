import { AccountReceivableType } from "../../../shared/enums/account-receivable-type.enum";
import { PaymentType } from "../../../shared/enums/payment-type.enum";

export interface PriceTable {
    id: number;
    price: number;
    type: AccountReceivableType;
    paymentType: PaymentType;
    dueDate: Date;
    active: number;
    createdAt: Date;
}