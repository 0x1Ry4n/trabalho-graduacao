import { z } from "zod";
import { routeRegistrationSchema } from "../route.schema";

export type CreateRouteDTO = z.infer<typeof routeRegistrationSchema>;
