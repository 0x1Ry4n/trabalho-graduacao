import { z } from "zod";
import { routeStopUpdateSchema } from "../route-stop.schema";

export type UpdateRouteStopDTO = z.infer<typeof routeStopUpdateSchema>;
