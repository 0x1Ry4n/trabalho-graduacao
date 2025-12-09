import { DbTransaction } from "../../../shared/database/base.repository";
import { EnrollmentStatus } from "../../../shared/enums/enrollment-status.enum";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { EnrollmentFilters, EnrollmentInsert, EnrollmentUpdate } from "../enrollment.types";
import { Enrollment } from "../interfaces/Enrollment";

export interface IEnrollmentRepository {
    findById(id: number, tx?: DbTransaction): Promise<Enrollment | null>;
    findByCardCode(cardCode: string, tx?: DbTransaction): Promise<Enrollment | null>;
    findByStudentId(studentId: number, tx?: DbTransaction): Promise<Enrollment | null>;
    findByStatus(status: EnrollmentStatus): Promise<Enrollment | null>;
    findByStudentIdAndCollege(studentId: number, collegeId: number, tx?: DbTransaction): Promise<Partial<Enrollment> | null>;
    findByStudentIdAndPeriod(studentId: number, year: number, semester: number, tx?: DbTransaction): Promise<Partial<Enrollment> | null>;
    findActiveWithoutMonthlyFee(month: number, year: number): Promise<Enrollment[] | null>;
    list(tx?: DbTransaction): Promise<Enrollment[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: EnrollmentFilters, tx?: DbTransaction): Promise<PaginatedDocument<Enrollment> | null>;
    create(data: EnrollmentInsert, tx?: DbTransaction): Promise<Partial<Enrollment>>;
    update(id: number, data: EnrollmentUpdate, tx?: DbTransaction): Promise<Partial<Enrollment> | null>;
}
