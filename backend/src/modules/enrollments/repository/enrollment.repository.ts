import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { Enrollment } from "../interfaces/Enrollment";
import { IEnrollmentRepository } from "./IEnrollmentRepository";
import { accountsReceivableTable, collegesTable, enrollmentsTable, payersTable, studentsTable } from "../../../config/db/db.schema";
import { and, asc, count, eq, getTableColumns, ilike, isNotNull, isNull, sql, SQL } from "drizzle-orm";
import { EnrollmentFilters, EnrollmentInsert, EnrollmentUpdate } from "../enrollment.types";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";
import { EnrollmentStatus } from "../../../shared/enums/enrollment-status.enum";
import { AccountReceivableType } from "../../../shared/enums/account-receivable-type.enum";
import { alias } from 'drizzle-orm/pg-core';
import { AccountStatus } from "../../../shared/enums/account-status.enum";

@Service()
export default class EnrollmentRepository extends BaseRepository<Enrollment> implements IEnrollmentRepository {
    async findById(id: number, tx?: DbTransaction): Promise<Enrollment | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .select({
                ...getTableColumns(enrollmentsTable),
                collegeName: collegesTable.name,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                    rg: studentsTable.rg,
                    phone: studentsTable.phone,
                    email: studentsTable.email,
                    photoUrl: studentsTable.photoUrl,
                    payerId: payersTable.id,
                },
            })
            .from(enrollmentsTable)
            .innerJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .innerJoin(payersTable, eq(payersTable.studentId, enrollmentsTable.studentId))
            .where(eq(enrollmentsTable.id, id))
            .limit(1);

        return enrollment ?? null;
    }

    async findByCardCode(cardCode: string, tx?: DbTransaction): Promise<Enrollment | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .select({
                ...getTableColumns(enrollmentsTable),
                collegeName: collegesTable.name,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                    rg: studentsTable.rg,
                    phone: studentsTable.phone,
                    email: studentsTable.email,
                    photoUrl: studentsTable.photoUrl,
                    payerId: payersTable.id,
                },
            })
            .from(enrollmentsTable)
            .innerJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .innerJoin(payersTable, eq(payersTable.studentId, enrollmentsTable.studentId))
            .where(eq(enrollmentsTable.cardCode, cardCode))
            .limit(1);

        return enrollment ?? null;
    }

    async findByStudentId(studentId: number, tx?: DbTransaction): Promise<Enrollment | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .select({
                ...getTableColumns(enrollmentsTable),
                collegeName: collegesTable.name,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                    rg: studentsTable.rg,
                    phone: studentsTable.phone,
                    email: studentsTable.email,
                    photoUrl: studentsTable.photoUrl,
                    payerId: payersTable.id,
                },
            })
            .from(enrollmentsTable)
            .innerJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .innerJoin(payersTable, eq(payersTable.studentId, enrollmentsTable.studentId))
            .where(eq(enrollmentsTable.studentId, studentId))
            .limit(1);

        return enrollment ?? null;
    }

    async findByStudentIdAndCollege(studentId: number, collegeId: number, tx?: DbTransaction): Promise<Partial<Enrollment> | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .select({
                collegeId: enrollmentsTable.collegeId,
                collegeName: collegesTable.name,
                status: enrollmentsTable.status,
            })
            .from(enrollmentsTable)
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .where(
                and(
                    eq(enrollmentsTable.collegeId, collegeId),
                    eq(enrollmentsTable.studentId, studentId)
                )
            )
            .limit(1)

        return enrollment ?? null;
    }


    async findByStatus(status: EnrollmentStatus, tx?: DbTransaction): Promise<Enrollment | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .select({
                ...getTableColumns(enrollmentsTable),
                collegeName: collegesTable.name,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                    rg: studentsTable.rg,
                    phone: studentsTable.phone,
                    email: studentsTable.email,
                    photoUrl: studentsTable.photoUrl,
                    payerId: payersTable.id,
                },
            })
            .from(enrollmentsTable)
            .innerJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .innerJoin(payersTable, eq(payersTable.studentId, enrollmentsTable.studentId))
            .where(eq(enrollmentsTable.status, status))
            .limit(1);

        return enrollment ?? null;
    }

    async findByStudentIdAndPeriod(studentId: number, year: number, semester: number, tx?: DbTransaction): Promise<Partial<Enrollment> | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .select({
                id: enrollmentsTable.id,
                course: enrollmentsTable.course,
                collegeName: collegesTable.name,
                status: enrollmentsTable.status
            })
            .from(enrollmentsTable)
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .where(and(
                eq(enrollmentsTable.studentId, studentId),
                eq(enrollmentsTable.year, year),
                eq(enrollmentsTable.semester, semester),
                isNull(enrollmentsTable.deletedAt)
            ))
            .limit(1);

        return enrollment ?? null;
    }

    // Busca matrículas ativas que ainda não possuem mensalidade gerada para o mês/ano especificado e que possuem taxa de matrícula paga 
    async findActiveWithoutMonthlyFee(month: number, year: number): Promise<Enrollment[] | null> {
        const enrollmentFeeTable = alias(accountsReceivableTable, 'enrollment_fee');

        return await this.db
            .select({
                ...getTableColumns(enrollmentsTable),
                collegeName: collegesTable.name,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                    rg: studentsTable.rg,
                    phone: studentsTable.phone,
                    email: studentsTable.email,
                    photoUrl: studentsTable.photoUrl,
                    payerId: payersTable.id,
                },
            })
            .from(enrollmentsTable)
            .innerJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
            .innerJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .innerJoin(payersTable, eq(payersTable.studentId, enrollmentsTable.studentId))
            .leftJoin(
                enrollmentFeeTable,
                and(
                    eq(enrollmentFeeTable.enrollmentId, enrollmentsTable.id),
                    eq(enrollmentFeeTable.accountReceivableType, AccountReceivableType.ENROLLMENT_FEE),
                    eq(enrollmentFeeTable.status, AccountStatus.PAID),
                )
            )
            .leftJoin(
                accountsReceivableTable,
                and(
                    eq(accountsReceivableTable.enrollmentId, enrollmentsTable.id),
                    eq(accountsReceivableTable.accountReceivableType, AccountReceivableType.MONTHLY_FEE),
                    sql`MONTH(${accountsReceivableTable.dueDate}) = ${month}`,
                    sql`YEAR(${accountsReceivableTable.dueDate}) = ${year}`,
                )
            )
            .where(
                and(
                    eq(enrollmentsTable.status, EnrollmentStatus.ACTIVE),
                    isNull(accountsReceivableTable.id),       // sem mensalidade gerada no período
                    isNotNull(enrollmentFeeTable.id),         // taxa de matrícula não paga
                )
            );
    }

    async create(data: EnrollmentInsert, tx?: DbTransaction): Promise<Partial<Enrollment>> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .insert(enrollmentsTable)
            .values(data)
            .returning();

        return enrollment;
    }

    async update(id: number, data: EnrollmentUpdate, tx?: DbTransaction): Promise<Partial<Enrollment> | null> {
        const dbInstance = this.getDb(tx);

        const [enrollment] = await dbInstance
            .update(enrollmentsTable)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(eq(enrollmentsTable.id, id))
            .returning();

        return enrollment ?? null
    }

    async listWithFiltersPaginated(page: number, pageSize: number, filters?: EnrollmentFilters, tx?: DbTransaction): Promise<PaginatedDocument<Enrollment> | null> {
        const dbInstance = this.getDb(tx);

        let enrollmentsQuery = dbInstance
            .select()
            .from(enrollmentsTable)
            .$dynamic();

        if (filters?.search) {
            const {
                student, cardCode, course,
                collegeId, semester, status, year
            } = filters.search;

            const conditions: SQL[] = [];

            if (student?.id) conditions.push(eq(enrollmentsTable.studentId, student.id));
            if (cardCode) conditions.push(ilike(enrollmentsTable.cardCode, `%${cardCode}%`));
            if (course) conditions.push(ilike(enrollmentsTable.course, `%${course}%`));
            if (collegeId) conditions.push(eq(enrollmentsTable.collegeId, collegeId));
            if (semester) conditions.push(eq(enrollmentsTable.semester, semester));
            if (status) conditions.push(eq(enrollmentsTable.status, status));
            if (year) conditions.push(eq(enrollmentsTable.year, year));

            if (conditions.length) {
                enrollmentsQuery = enrollmentsQuery.where(and(...conditions));
            }
        }

        const enrollmentsTotalCountQuery = dbInstance
            .select({ count: count() })
            .from(enrollmentsTable);

        return paginateQuery<Enrollment>(
            enrollmentsQuery,
            enrollmentsTotalCountQuery,
            asc(enrollmentsTable.id),
            { page, pageSize }
        )
    }

    async list(tx?: DbTransaction): Promise<Enrollment[]> {
        const dbInstance = this.getDb(tx);

        const enrollments = await dbInstance
            .select({
                id: enrollmentsTable.id,
                student: {
                    id: studentsTable.id,
                    name: studentsTable.name,
                    cpf: studentsTable.cpf,
                    rg: studentsTable.rg,
                    phone: studentsTable.phone,
                    email: studentsTable.email,
                    photoUrl: studentsTable.photoUrl,
                    payerId: payersTable.id,
                },
                cardCode: enrollmentsTable.cardCode,
                collegeId: enrollmentsTable.collegeId,
                collegeName: collegesTable.name,
                course: enrollmentsTable.course,
                semester: enrollmentsTable.semester,
                year: enrollmentsTable.year,
                monthlyFee: enrollmentsTable.monthlyFee,
                enrollmentFee: enrollmentsTable.enrollmentFee,
                status: enrollmentsTable.status,
                photoUrl: enrollmentsTable.photoUrl,
                residenceProofUrl: enrollmentsTable.residenceProofUrl,
                collegeEnrollmentUrl: enrollmentsTable.collegeEnrollmentUrl,
                deletedAt: enrollmentsTable.deletedAt,
                createdAt: enrollmentsTable.createdAt,
                updatedAt: enrollmentsTable.updatedAt
            })
            .from(enrollmentsTable)
            .leftJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
            .leftJoin(collegesTable, eq(enrollmentsTable.collegeId, collegesTable.id))
            .leftJoin(payersTable, eq(payersTable.studentId, enrollmentsTable.studentId))
            .where(isNull(enrollmentsTable.deletedAt));

        return enrollments
            .filter(enrollment => enrollment.student !== null)
            .map(enrollment => ({
                ...enrollment,
                student: {
                    id: enrollment.student!.id!,
                    name: enrollment.student!.name!,
                    cpf: enrollment.student!.cpf!,
                    rg: enrollment.student!.rg!,
                    phone: enrollment.student!.phone!,
                    email: enrollment.student!.email!,
                    photoUrl: enrollment.student!.photoUrl!,
                    payerId: enrollment.student!.payerId!,
                }
            })) as Enrollment[];
    }
}
