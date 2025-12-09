import { InferInsertModel } from "drizzle-orm";
import { enrollmentsTable } from "../../config/db/db.schema";
import { z } from "zod";
import { Enrollment } from "./interfaces/Enrollment";
import { enrollmentListPaginatedSchema } from "./enrollment.schema";

export type EnrollmentInsert = InferInsertModel<typeof enrollmentsTable>;
export type EnrollmentUpdate = Partial<EnrollmentInsert>;
export type EnrollmentListPaginatedQuery = z.infer<typeof enrollmentListPaginatedSchema>;
export type EnrollmentFilters = {
    search?: Partial<Enrollment>
}