import { and, asc, count, eq, getTableColumns, ilike, sql, SQL } from "drizzle-orm";
import { Service } from "typedi";
import { cardValidationsTable, driversTable, routesTable, studentsTable } from "../../../config/db/db.schema";
import { Student } from "../interfaces/Student";
import { CardValidation } from "../interfaces/CardValidation";
import { CardValidationFilters, CardValidationInsert, StudentFilters, StudentInsert, StudentUpdate } from "../student.types";
import { IStudentRepository } from "./IStudentRepository";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";

@Service()
export default class StudentRepository extends BaseRepository<Student> implements IStudentRepository {
    async findByUserId(userId: number, tx?: DbTransaction): Promise<Student> {
        const dbInstance = this.getDb(tx);

        const [driver] = await dbInstance
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.userId, userId));

        return driver ?? null;
    }

    async findById(id: number, tx?: DbTransaction): Promise<Student> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.id, id))
            .limit(1);

        return student ?? null;
    }

    async findByEmail(email: string, tx?: DbTransaction): Promise<Student> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.email, email));

        return student ?? null;
    }

    async findByPhone(phone: string, tx?: DbTransaction): Promise<Student | null> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.phone, phone));

        return student ?? null;
    }

    async findByCPF(cpf: string, tx?: DbTransaction): Promise<Student> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.cpf, cpf));

        return student ?? null;
    }

    async findByRG(rg: string, tx?: DbTransaction): Promise<Student> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.rg, rg));

        return student ?? null;
    }

    async listCardValidationsByStudentId(studentId: number, tx?: DbTransaction): Promise<CardValidation[]> {
        const dbInstance = this.getDb(tx);

        const validations = await dbInstance
            .select({
                id: cardValidationsTable.id,
                studentId: cardValidationsTable.studentId,
                driverId: cardValidationsTable.driverId,
                routeId: cardValidationsTable.routeId,
                latitude: cardValidationsTable.latitude,
                longitude: cardValidationsTable.longitude,
                status: cardValidationsTable.status,
                validationTime: cardValidationsTable.validationTime,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                },
                driver: {
                    id: driversTable.id,
                    name: driversTable.name,
                    cpf: driversTable.cpf,
                },
                route: {
                    id: routesTable.id,
                    name: routesTable.name,
                },
            })
            .from(cardValidationsTable)
            .innerJoin(studentsTable, eq(cardValidationsTable.studentId, studentsTable.id))
            .innerJoin(driversTable, eq(cardValidationsTable.driverId, driversTable.id))
            .innerJoin(routesTable, eq(cardValidationsTable.routeId, routesTable.id))
            .where(eq(cardValidationsTable.studentId, studentId));

        return validations.map(v => ({
            ...v,
            latitude: v.latitude != null ? parseFloat(v.latitude) : null,
            longitude: v.longitude != null ? parseFloat(v.longitude) : null,
        }));
    }

    async create(data: StudentInsert, tx?: DbTransaction): Promise<Student> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .insert(studentsTable)
            .values(data)
            .returning();

        return student;
    }

    async createCardValidation(data: CardValidationInsert, tx?: DbTransaction): Promise<CardValidation> {
        const dbInstance = this.getDb(tx);

        const [cardValidation] = await dbInstance
            .insert(cardValidationsTable)
            .values(data)
            .returning();

        return {
            ...cardValidation,
            latitude: cardValidation.latitude != null ? parseFloat(cardValidation.latitude) : null,
            longitude: cardValidation.longitude != null ? parseFloat(cardValidation.longitude) : null,
        };
    }

    async update(id: number, data: StudentUpdate, tx?: DbTransaction): Promise<Student | null> {
        const dbInstance = this.getDb(tx);

        const [student] = await dbInstance
            .update(studentsTable)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(eq(studentsTable.id, id))
            .returning();

        return student ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(studentsTable)
            .set({
                active: 1
            })
            .where(eq(studentsTable.id, id))
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(studentsTable)
            .set({
                active: 0
            })
            .where(eq(studentsTable.id, id))
    }

    async list(tx?: DbTransaction): Promise<Student[]> {
        const dbInstance = this.getDb(tx);

        const result = await dbInstance
            .select({
                ...getTableColumns(studentsTable),
                cardValidations: sql<CardValidation[]>`
                    COALESCE(
                        json_agg(${cardValidationsTable})
                        FILTER (WHERE ${cardValidationsTable.id} IS NOT NULL),
                        '[]'
                    )
                `
            })
            .from(studentsTable)
            .leftJoin(cardValidationsTable, eq(cardValidationsTable.studentId, studentsTable.id))
            .groupBy(studentsTable.id);

        return result;
    }

    async listWithFiltersPaginated(
        page: number = 1,
        pageSize: number = 10,
        filters?: StudentFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<Student> | null> {
        const dbInstance = this.getDb(tx);

        let studentsQuery = dbInstance
            .select({
                id: studentsTable.id,
                name: studentsTable.name,
                motherName: studentsTable.motherName,
                cpf: studentsTable.cpf,
                rg: studentsTable.rg,
                cin: studentsTable.cin,
                email: studentsTable.email,
                phone: studentsTable.phone,
                birthDate: studentsTable.birthDate,
                collegeId: studentsTable.collegeId,
                course: studentsTable.course,
                semester: studentsTable.semester,
                year: studentsTable.year,
                city: studentsTable.city,
                neighborhood: studentsTable.neighborhood,
                address: studentsTable.address,
                cep: studentsTable.cep,
                photoUrl: studentsTable.photoUrl,
                residenceProof: studentsTable.photoUrl,
                notes: studentsTable.notes,
                active: studentsTable.active,
                createdAt: studentsTable.createdAt,
                updatedAt: studentsTable.updatedAt,
                deletedAt: studentsTable.deletedAt
            })
            .from(studentsTable)
            .$dynamic();

        if (filters?.search) {
            const { name, motherName, cpf, rg, cin, email, phone,
                birthDate, collegeId, course, semester, year, city,
                neighborhood, address, cep, notes, active, createdAt } = filters.search;

            const conditions: SQL[] = [];

            if (name) conditions.push(ilike(studentsTable.name, `%${name}%`));
            if (motherName) conditions.push(ilike(studentsTable.motherName, `%${motherName}%`));
            if (cpf) conditions.push(ilike(studentsTable.cpf, `%${cpf}%`));
            if (rg) conditions.push(ilike(studentsTable.rg, `%${rg}%`));
            if (cin) conditions.push(ilike(studentsTable.cin, `%${cin}%`));
            if (email) conditions.push(ilike(studentsTable.email, `%${email}%`));
            if (phone) conditions.push(ilike(studentsTable.phone, `%${phone}%`));
            if (birthDate) conditions.push(eq(studentsTable.birthDate, birthDate));
            if (collegeId) conditions.push(eq(studentsTable.collegeId, collegeId));
            if (course) conditions.push(ilike(studentsTable.course, `%${course}%`));
            if (semester) conditions.push(eq(studentsTable.semester, semester));
            if (year) conditions.push(eq(studentsTable.year, year));
            if (city) conditions.push(ilike(studentsTable.city, `%${city}%`));
            if (neighborhood) conditions.push(ilike(studentsTable.neighborhood, `%${neighborhood}%`));
            if (address) conditions.push(ilike(studentsTable.address, `%${address}%`));
            if (cep) conditions.push(ilike(studentsTable.cep, `%${cep}%`));
            if (notes) conditions.push(ilike(studentsTable.notes, `%${notes}%`));
            if (active !== undefined) conditions.push(eq(studentsTable.active, active));
            if (createdAt) conditions.push(eq(studentsTable.createdAt, createdAt));

            if (conditions.length) {
                studentsQuery = studentsQuery.where(and(...conditions));
            }
        }

        const studentsTotalCountQuery = await dbInstance
            .select({ count: count() })
            .from(studentsTable);

        return paginateQuery<Student>(
            studentsQuery,
            studentsTotalCountQuery,
            asc(studentsTable.id),
            { page, pageSize }
        )
    }

    async listCardValidationsByStudentIdWithFiltersPaginated(
        studentId: number,
        page: number = 1,
        pageSize: number = 10,
        filters?: CardValidationFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<CardValidation> | null> {
        const dbInstance = this.getDb(tx);

        let query = dbInstance
            .select()
            .from(cardValidationsTable)
            .where(eq(cardValidationsTable.studentId, studentId))
            .$dynamic();

        if (filters?.search) {
            const { driverId, routeId, status, validationTime } = filters.search;
            const conditions: SQL[] = [eq(cardValidationsTable.studentId, studentId)];

            if (driverId) conditions.push(eq(cardValidationsTable.driverId, driverId));
            if (routeId) conditions.push(eq(cardValidationsTable.routeId, routeId));
            if (status) conditions.push(eq(cardValidationsTable.status, status));
            if (validationTime) conditions.push(eq(cardValidationsTable.validationTime, validationTime));

            if (conditions.length) {
                query = query.where(and(...conditions));
            }
        }

        const totalCountQuery = await dbInstance
            .select({ count: count() })
            .from(cardValidationsTable)
            .where(eq(cardValidationsTable.studentId, studentId));

        return paginateQuery<CardValidation>(
            query,
            totalCountQuery,
            asc(cardValidationsTable.validationTime),
            { page, pageSize }
        );
    }
}
