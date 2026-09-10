CREATE TYPE "public"."charge_method" AS ENUM('PIX', 'BOLETO', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."charge_status" AS ENUM('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('ABACATEPAY');--> statement-breakpoint
ALTER TYPE "public"."payment_type" ADD VALUE 'BOLETO' BEFORE 'BANK_TRANSFER';--> statement-breakpoint
CREATE TABLE "payment_charges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_charges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"accountReceivableId" integer NOT NULL,
	"provider" "payment_provider" DEFAULT 'ABACATEPAY' NOT NULL,
	"providerChargeId" varchar(100),
	"externalId" varchar(100) NOT NULL,
	"method" charge_method NOT NULL,
	"status" charge_status DEFAULT 'PENDING' NOT NULL,
	"amountCents" integer NOT NULL,
	"brCode" varchar(1000),
	"barCode" varchar(100),
	"paymentUrl" varchar(500),
	"expiresAt" timestamp,
	"paidAt" timestamp,
	"lastCheckedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_charges_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "webhook_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"provider" "payment_provider" DEFAULT 'ABACATEPAY' NOT NULL,
	"eventKey" varchar(200) NOT NULL,
	"eventType" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"processedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_eventKey_unique" UNIQUE("eventKey")
);
--> statement-breakpoint
ALTER TABLE "payment_charges" ADD CONSTRAINT "payment_charges_accountReceivableId_accounts_receivable_id_fk" FOREIGN KEY ("accountReceivableId") REFERENCES "public"."accounts_receivable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_charges_account_idx" ON "payment_charges" USING btree ("accountReceivableId");--> statement-breakpoint
CREATE INDEX "payment_charges_provider_charge_idx" ON "payment_charges" USING btree ("providerChargeId");