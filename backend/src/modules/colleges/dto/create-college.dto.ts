import { z } from "zod";
import { collegeRegistrationSchema } from "../college.schema";

// O DTO serve para definir a estrutura dos dados que serão recebidos na requisição de criação de uma instituição de ensino, garantindo que os dados estejam no formato esperado e sejam validados corretamente antes de serem processados pela aplicação. Ele é baseado no schema de validação definido em college.schema.ts, utilizando a biblioteca Zod para inferir o tipo dos dados a partir do schema de validação.
export type CreateCollegeDTO = z.infer<typeof collegeRegistrationSchema>; 