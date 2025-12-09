import { z } from "zod";
import { collegeUpdateSchema } from "../college.schema";

export type UpdateCollegeDTO = z.infer<typeof collegeUpdateSchema>;