import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { Payer } from "../interfaces/Payer";
import { IPayerRepository } from "./IPayerRepository";
import { payersTable } from "../../../config/db/db.schema";
import { eq, ilike } from "drizzle-orm";
import { PayerInsert } from "../payer.types";

@Service()
export default class PayerRepository extends BaseRepository<Payer> implements IPayerRepository {
    async findById(id: number, tx?: DbTransaction): Promise<Payer | null> {
        const dbInstance = this.getDb(tx);

        const [payer] = await dbInstance
            .select({
                id: payersTable.id,
                type: payersTable.type,
                studentId: payersTable.studentId,
                companyName: payersTable.companyName
            })
            .from(payersTable)
            .where(eq(payersTable.id, id))
            .limit(1);

        return payer;
    }

    async findByCompanyName(companyName: string, tx?: DbTransaction): Promise<Payer | null> {
        const dbInstance = this.getDb(tx);

        const [payer] = await dbInstance
            .select({
                id: payersTable.id,
                type: payersTable.type,
                studentId: payersTable.studentId,
                companyName: payersTable.companyName
            })
            .from(payersTable)
            .where(ilike(payersTable.companyName, `%${companyName}%`))
            .limit(1);

        return payer ?? null;
    }

    async findByStudentId(studentId: number, tx?: DbTransaction): Promise<Payer | null> {
        const dbInstance = this.getDb(tx);

        const [payer] = await dbInstance
            .select({
                id: payersTable.id,
                type: payersTable.type,
                studentId: payersTable.studentId,
                companyName: payersTable.companyName
            })
            .from(payersTable)
            .where(eq(payersTable.studentId, studentId))
            .limit(1);

        return payer;
    }

    async list(tx?: DbTransaction): Promise<Payer[]> {
        const dbInstance = this.getDb(tx);

        const payers = await dbInstance
            .select({
                id: payersTable.id,
                type: payersTable.type,
                studentId: payersTable.studentId,
                companyName: payersTable.companyName
            })
            .from(payersTable);

        return payers;
    }

    async create(data: PayerInsert, tx?: DbTransaction): Promise<Payer> {
        const dbInstance = this.getDb(tx);

        const [payer] = await dbInstance
            .insert(payersTable)
            .values(data)
            .returning({
                id: payersTable.id,
                type: payersTable.type,
                studentId: payersTable.studentId,
                companyName: payersTable.companyName
            });

        return payer;
    }
}