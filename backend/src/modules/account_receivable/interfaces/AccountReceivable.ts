import { AccountReceivableType } from "../../../shared/enums/account-receivable-type.enum";
import { AccountStatus } from "../../../shared/enums/account-status.enum";
import { PaymentProofType } from "../../../shared/enums/payment-proof-type.enum";
import { PaymentType } from "../../../shared/enums/payment-type.enum";

export interface AccountReceivable {
    id: number;
    payerId: number;
    enrollmentId: number | null;
    description: string | null;
    amount: number;
    dueDate: Date;
    accountReceivableType: AccountReceivableType;
    paymentType: PaymentType;
    status: AccountStatus;
    paymentDate: Date | null;
    paymentProofUrl: string | undefined;
    paymentProofType: PaymentProofType | undefined;
    createdAt: Date;
    updatedAt: Date | null;
}