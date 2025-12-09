ALTER TABLE "student_routes" DROP CONSTRAINT "unique_student_route_time";--> statement-breakpoint
ALTER TABLE "student_routes" DROP CONSTRAINT "student_routes_routeId_routes_id_fk";
--> statement-breakpoint
ALTER TABLE "student_routes" DROP CONSTRAINT "student_routes_stopId_stops_id_fk";
--> statement-breakpoint
ALTER TABLE "student_routes" ADD COLUMN "routeStopId" integer;--> statement-breakpoint
UPDATE "student_routes" AS "sr"
SET "routeStopId" = "rs"."id"
FROM "route_stops" AS "rs"
WHERE "sr"."routeId" = "rs"."routeId"
  AND "sr"."stopId" = "rs"."stopId";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "student_routes" WHERE "routeStopId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate student_routes: routeId/stopId pair does not exist in route_stops';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "student_routes" ALTER COLUMN "routeStopId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_routeStopId_route_stops_id_fk" FOREIGN KEY ("routeStopId") REFERENCES "public"."route_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routes" DROP COLUMN "routeId";--> statement-breakpoint
ALTER TABLE "student_routes" DROP COLUMN "stopId";--> statement-breakpoint
ALTER TABLE "student_routes" ADD CONSTRAINT "unique_student_route_time" UNIQUE("studentId","routeStopId","routePeriod");
