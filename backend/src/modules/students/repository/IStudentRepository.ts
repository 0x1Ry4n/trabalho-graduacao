import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { CardValidation } from "../interfaces/CardValidation";
import { Student } from "../interfaces/Student";
import { CardValidationFilters, CardValidationInsert, StudentFilters, StudentInsert, StudentUpdate } from "../student.types";

export interface IStudentRepository {
    findByUserId(userId: number, tx?: DbTransaction): Promise<Student>
    findById(id: number, tx?: DbTransaction): Promise<Student | null>;
    findByEmail(email: string, tx?: DbTransaction): Promise<Student | null>;
    findByPhone(phone: string, tx?: DbTransaction): Promise<Student | null>;
    findByCPF(cpf: string, tx?: DbTransaction): Promise<Student | null>;
    findByRG(rg: string, tx?: DbTransaction): Promise<Student | null>;
    list(tx?: DbTransaction): Promise<Student[]>;
    listCardValidationsByStudentId(studentId: number, tx?: DbTransaction): Promise<CardValidation[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: StudentFilters, tx?: DbTransaction): Promise<PaginatedDocument<Student> | null>;
    listCardValidationsByStudentIdWithFiltersPaginated(studentId: number, page: number, pageSize: number, filters?: CardValidationFilters, tx?: DbTransaction): Promise<PaginatedDocument<CardValidation> | null>;
    create(data: StudentInsert, tx?: DbTransaction): Promise<Student>;
    createCardValidation(data: CardValidationInsert, tx?: DbTransaction): Promise<CardValidation>;
    update(id: number, data: StudentUpdate, tx?: DbTransaction): Promise<Student | null>;
    activate(id: number, tx?: DbTransaction): Promise<void>;
    inactivate(id: number, tx?: DbTransaction): Promise<void>;
}
