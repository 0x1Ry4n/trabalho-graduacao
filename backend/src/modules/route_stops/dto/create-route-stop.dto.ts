import { z } from "zod";
import { routeStopRegistrationSchema } from "../route-stop.schema";

export type CreateRouteStopDTO = z.infer<typeof routeStopRegistrationSchema>;
