import { z } from "zod";
import { studentUpdateSchema } from "../student.schema";

export type UpdateStudentDTO = z.infer<typeof studentUpdateSchema>;