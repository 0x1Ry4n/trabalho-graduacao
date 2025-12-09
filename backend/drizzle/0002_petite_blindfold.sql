CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'INACTIVATE');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"action" "audit_action" NOT NULL,
	"entityType" varchar(100) NOT NULL,
	"entityId" integer NOT NULL,
	"oldValues" jsonb,
	"newValues" jsonb,
	"ipAddress" varchar(50),
	"userAgent" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "schedule_exceptions" CASCADE;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "notes" varchar(1000);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;