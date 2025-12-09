import { z } from "zod";
import { routeUpdateSchema } from "../route.schema";

export type UpdateRouteDTO = z.infer<typeof routeUpdateSchema>;
