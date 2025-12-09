ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_unique" UNIQUE("userId");--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_userId_unique" UNIQUE("userId");