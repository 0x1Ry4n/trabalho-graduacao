import { z } from "zod";
import { InferInsertModel } from "drizzle-orm";
import { collegesTable } from "../../config/db/db.schema";
import { collegeListPaginatedSchema } from "./college.schema";
import { College } from "./interfaces/College";

export type CollegeInsert = InferInsertModel<typeof collegesTable>;
export type CollegeUpdate = Partial<CollegeInsert>;
export type CollegeListPaginatedQuery = z.infer<typeof collegeListPaginatedSchema>;
export type CollegeFilters = {
    search?: Partial<College>
}