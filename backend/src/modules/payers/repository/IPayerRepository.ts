import { DbTransaction } from "../../../shared/database/base.repository";
import { Payer } from "../interfaces/Payer";
import { PayerInsert } from "../payer.types";

export interface IPayerRepository {
    findById(id: number, tx?: DbTransaction): Promise<Payer | null>;
    findByStudentId(studentId: number, tx?: DbTransaction): Promise<Payer | null>;
    findByCompanyName(companyName: string, tx?: DbTransaction): Promise<Payer | null>;
    list(tx?: DbTransaction): Promise<Payer[]>;
    create(data: PayerInsert, tx?: DbTransaction): Promise<Payer>;
}