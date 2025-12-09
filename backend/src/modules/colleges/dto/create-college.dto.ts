import { z } from "zod";
import { collegeRegistrationSchema } from "../college.schema";

export type CreateCollegeDTO = z.infer<typeof collegeRegistrationSchema>; 