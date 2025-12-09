CREATE TYPE "public"."account_receivable_type" AS ENUM('ENROLLMENT_FEE', 'MONTHLY_FEE');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('OPEN', 'PAID', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."card_validation_status" AS ENUM('VALID', 'INVALID');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('CLT', 'PJ', 'FREELANCER');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('ACTIVE', 'CANCELED', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."payer_type" AS ENUM('STUDENT', 'COMPANY');--> statement-breakpoint
CREATE TYPE "public"."payment_proof_type" AS ENUM('FILE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'ANY');--> statement-breakpoint
CREATE TYPE "public"."route_period" AS ENUM('MORNING', 'AFTERNOON', 'NIGHT');--> statement-breakpoint
CREATE TYPE "public"."trip_expense_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."trip_expense_type" AS ENUM('FUEL', 'MAINTENANCE', 'TOLL', 'PARKING', 'CLEANING', 'INSURANCE', 'LICENSE', 'REPAIR', 'PARTS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'DRIVER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('MICROBUS', 'BUS', 'VAN');--> statement-breakpoint
CREATE TABLE "accounts_receivable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_receivable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"payerId" integer NOT NULL,
	"enrollmentId" integer,
	"description" varchar(200),
	"amount" numeric(10, 2) NOT NULL,
	"dueDate" date NOT NULL,
	"accountReceivableType" "account_receivable_type" NOT NULL,
	"paymentType" "payment_type" DEFAULT 'ANY' NOT NULL,
	"status" "account_status" DEFAULT 'OPEN' NOT NULL,
	"paymentDate" date,
	"paymentProofUrl" varchar(255),
	"paymentProofType" "payment_proof_type",
	"active" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_proof_check" CHECK ("accounts_receivable"."paymentProofUrl" IS NULL OR "accounts_receivable"."status" = 'PAID')
);
--> statement-breakpoint
CREATE TABLE "card_validations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "card_validations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"driverId" integer NOT NULL,
	"routeId" integer NOT NULL,
	"validationTime" timestamp DEFAULT now() NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" "card_validation_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "colleges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"city" varchar(100) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"address" varchar(200) NOT NULL,
	"cep" varchar(15) NOT NULL,
	"contactEmail" varchar(255),
	"contactPhone" varchar(50),
	"active" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_active_check" CHECK ("colleges"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "drivers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"motherName" varchar(150) NOT NULL,
	"cpf" varchar(15) NOT NULL,
	"cnpj" varchar(18),
	"rg" varchar(11) NOT NULL,
	"licenseNumber" varchar(11) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"birthDate" date NOT NULL,
	"city" varchar(100) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"address" varchar(200) NOT NULL,
	"cep" varchar(15) NOT NULL,
	"companyName" varchar(150),
	"contractType" "contract_type" NOT NULL,
	"salary" numeric(10, 2) NOT NULL,
	"admissionDate" date NOT NULL,
	"rescissionDate" date,
	"photoUrl" varchar(255),
	"residenceProofUrl" varchar(255),
	"active" integer DEFAULT 1 NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "drivers_cnpj_unique" UNIQUE("cnpj"),
	CONSTRAINT "drivers_rg_unique" UNIQUE("rg"),
	CONSTRAINT "drivers_licenseNumber_unique" UNIQUE("licenseNumber"),
	CONSTRAINT "drivers_phone_unique" UNIQUE("phone"),
	CONSTRAINT "drivers_email_unique" UNIQUE("email"),
	CONSTRAINT "drivers_companyName_unique" UNIQUE("companyName"),
	CONSTRAINT "driver_active_check" CHECK ("drivers"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"cardCode" char(12) NOT NULL,
	"collegeId" integer NOT NULL,
	"course" varchar(150) NOT NULL,
	"semester" integer NOT NULL,
	"year" integer NOT NULL,
	"monthlyFee" numeric(10, 2) NOT NULL,
	"enrollmentFee" numeric(10, 2) NOT NULL,
	"status" "enrollment_status" DEFAULT 'ACTIVE' NOT NULL,
	"photoUrl" varchar(255),
	"residenceProofUrl" varchar(255),
	"collegeEnrollmentUrl" varchar(255) NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_cardCode_unique" UNIQUE("cardCode"),
	CONSTRAINT "enrollment_unique_student_period" UNIQUE("studentId","year","semester"),
	CONSTRAINT "enrollment_year_semester_check" CHECK ("enrollments"."year" >= 2000 AND "enrollments"."semester" IN (1,2))
);
--> statement-breakpoint
CREATE TABLE "payers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "payer_type" NOT NULL,
	"studentId" integer,
	"companyName" varchar(150),
	"active" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payers_active_check" CHECK ("payers"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "prices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"price" numeric(10, 2) NOT NULL,
	"type" "account_receivable_type" NOT NULL,
	"paymentType" "payment_type" DEFAULT 'ANY' NOT NULL,
	"dueDate" date NOT NULL,
	"active" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prices_type_unique" UNIQUE("type"),
	CONSTRAINT "prices_table_active_check" CHECK ("prices"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "route_stops_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"routeId" integer NOT NULL,
	"stopId" integer NOT NULL,
	"stopOrder" integer NOT NULL,
	"estimatedArrival" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_route_stop_order" UNIQUE("routeId","stopOrder")
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "routes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"vehicleId" integer NOT NULL,
	"driverId" integer NOT NULL,
	"startLat" numeric(10, 7) NOT NULL,
	"startLong" numeric(10, 7) NOT NULL,
	"endLat" numeric(10, 7) NOT NULL,
	"endLong" numeric(10, 7) NOT NULL,
	"startTime" time NOT NULL,
	"endTime" time,
	"estimatedDuration" integer NOT NULL,
	"active" integer NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "route_active_check" CHECK ("routes"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "schedule_exceptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "schedule_exceptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"routeId" integer NOT NULL,
	"exceptionDate" date NOT NULL,
	"reason" varchar(200) NOT NULL,
	"alternativeRouteId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_route_exception_date" UNIQUE("routeId","exceptionDate")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" integer NOT NULL,
	"refresh_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_userId_unique" UNIQUE("userId"),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stops_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"city" varchar(100) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"address" varchar(200) NOT NULL,
	"cep" varchar(15) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_routes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "student_routes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"routeId" integer NOT NULL,
	"stopId" integer NOT NULL,
	"routePeriod" "route_period" NOT NULL,
	"departureTime" time NOT NULL,
	"returnTime" time NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"active" integer NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_student_route_time" UNIQUE("studentId","routeId","routePeriod"),
	CONSTRAINT "student_route_active_check" CHECK ("student_routes"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "students_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"motherName" varchar(150) NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"rg" varchar(12) NOT NULL,
	"cin" varchar(11),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"birthDate" date NOT NULL,
	"collegeId" integer NOT NULL,
	"course" varchar(150) NOT NULL,
	"semester" integer NOT NULL,
	"year" integer NOT NULL,
	"city" varchar(100) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"address" varchar(200) NOT NULL,
	"cep" varchar(15) NOT NULL,
	"photoUrl" varchar(255),
	"residenceProofUrl" varchar(255),
	"notes" varchar(1000),
	"active" integer DEFAULT 1 NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "students_rg_unique" UNIQUE("rg"),
	CONSTRAINT "students_cin_unique" UNIQUE("cin"),
	CONSTRAINT "students_email_unique" UNIQUE("email"),
	CONSTRAINT "students_phone_unique" UNIQUE("phone"),
	CONSTRAINT "student_active_check" CHECK ("students"."active" IN (0, 1)),
	CONSTRAINT "student_year_semester_check" CHECK ("students"."year" >= 2000 AND "students"."semester" IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"emailVerificationDate" date,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "user_active_check" CHECK ("users"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vehicles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"plate" varchar(10) NOT NULL,
	"model" varchar(50) NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"capacity" integer NOT NULL,
	"active" integer NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate"),
	CONSTRAINT "vehicle_active_check" CHECK ("vehicles"."active" IN (0, 1))
);
--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_payerId_payers_id_fk" FOREIGN KEY ("payerId") REFERENCES "public"."payers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_enrollmentId_enrollments_id_fk" FOREIGN KEY ("enrollmentId") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_validations" ADD CONSTRAINT "card_validations_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_validations" ADD CONSTRAINT "card_validations_driverId_drivers_id_fk" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_validations" ADD CONSTRAINT "card_validations_routeId_routes_id_fk" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_collegeId_colleges_id_fk" FOREIGN KEY ("collegeId") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payers" ADD CONSTRAINT "payers_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_routes_id_fk" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_stopId_stops_id_fk" FOREIGN KEY ("stopId") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_vehicleId_vehicles_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_driverId_drivers_id_fk" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_routeId_routes_id_fk" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_alternativeRouteId_routes_id_fk" FOREIGN KEY ("alternativeRouteId") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_routeId_routes_id_fk" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_stopId_stops_id_fk" FOREIGN KEY ("stopId") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_collegeId_colleges_id_fk" FOREIGN KEY ("collegeId") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;