import { InferInsertModel } from "drizzle-orm";
import { cardValidationsTable, studentsTable } from "../../config/db/db.schema";
import { cardValidationPaginatedSchema, studentListPaginatedSchema } from "./student.schema";
import { Student } from "./interfaces/Student";
import { z } from "zod";
import { CardValidation } from "./interfaces/CardValidation";

export type StudentInsert = InferInsertModel<typeof studentsTable>;
export type CardValidationInsert = InferInsertModel<typeof cardValidationsTable>;
export type StudentUpdate = Partial<StudentInsert>;
export type StudentListPaginatedQuery = z.infer<typeof studentListPaginatedSchema>;
export type StudentFilters = {
    search?: Partial<Student>
}
export type CardValidationListPaginatedQuery = z.infer<typeof cardValidationPaginatedSchema>;
export type CardValidationFilters = {
    search?: Partial<CardValidation>
};