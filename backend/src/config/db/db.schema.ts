import { sql } from "drizzle-orm";
import { integer, pgTable, pgEnum, varchar, timestamp, date, numeric, uuid, check, unique, time, char, jsonb, index } from "drizzle-orm/pg-core";
import {
  VehicleCategory, CardValidationStatus, TripExpenseCategory, TripExpenseStatus,
  RoutePeriod, AccountStatus, PaymentProofType, PaymentType, PayerType, EnrollmentStatus, DriverContractType, UserRole, AuditAction,
  ChargeMethod, ChargeStatus, PaymentProvider
} from "../../shared/enums/index.enum";
import { AccountReceivableType } from "../../shared/enums/account-receivable-type.enum";

export const userRoleEnum = pgEnum("user_role", UserRole);
export const driverContractTypeEnum = pgEnum("contract_type", DriverContractType);
export const enrollmentStatusEnum = pgEnum("enrollment_status", EnrollmentStatus);
export const payerTypeEnum = pgEnum("payer_type", PayerType);
export const paymentTypeEnum = pgEnum("payment_type", PaymentType);
export const paymentProofTypeEnum = pgEnum("payment_proof_type", PaymentProofType);
export const accountStatusEnum = pgEnum("account_status", AccountStatus);
export const accountReceivableTypeEnum = pgEnum("account_receivable_type", AccountReceivableType);
export const vehicleTypeEnum = pgEnum("vehicle_type", VehicleCategory);
export const cardValidationStatusEnum = pgEnum("card_validation_status", CardValidationStatus);
export const routePeriodEnum = pgEnum("route_period", RoutePeriod);
export const tripExpenseStatusEnum = pgEnum("trip_expense_status", TripExpenseStatus);
export const tripExpenseTypeEnum = pgEnum("trip_expense_type", TripExpenseCategory);
export const auditActionEnum = pgEnum("audit_action", AuditAction);
export const chargeMethodEnum = pgEnum("charge_method", ChargeMethod);
export const chargeStatusEnum = pgEnum("charge_status", ChargeStatus);
export const paymentProviderEnum = pgEnum("payment_provider", PaymentProvider);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  role: userRoleEnum().notNull(),
  active: integer().notNull().default(1),
  emailVerificationDate: date(),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("user_active_check", sql`${table.active} IN (0, 1)`)
]);

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  refreshToken: varchar("refresh_token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const driversTable = pgTable("drivers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id).unique(),
  name: varchar({ length: 150 }).notNull(),
  motherName: varchar({ length: 150 }).notNull(),
  cpf: varchar({ length: 15 }).notNull().unique(),
  cnpj: varchar({ length: 18 }).unique(),
  rg: varchar({ length: 11 }).notNull().unique(),
  licenseNumber: varchar({ length: 11 }).notNull().unique(),
  phone: varchar({ length: 20 }).unique(),
  email: varchar({ length: 255 }).unique(),
  birthDate: date().notNull(),
  city: varchar({ length: 100 }).notNull(),
  neighborhood: varchar({ length: 100 }).notNull(),
  address: varchar({ length: 200 }).notNull(),
  cep: varchar({ length: 15 }).notNull(),
  companyName: varchar({ length: 150 }).unique(),
  contractType: driverContractTypeEnum().notNull(),
  salary: numeric({ precision: 10, scale: 2 }).notNull(),
  admissionDate: date().notNull(),
  rescissionDate: date(),
  photoUrl: varchar({ length: 255 }),
  residenceProofUrl: varchar({ length: 255 }),
  active: integer().notNull().default(1),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("driver_active_check", sql`${table.active} IN (0, 1)`)
]);

export const collegesTable = pgTable("colleges", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 150 }).notNull(),
  city: varchar({ length: 100 }).notNull(),
  neighborhood: varchar({ length: 100 }).notNull(),
  address: varchar({ length: 200 }).notNull(),
  cep: varchar({ length: 15 }).notNull(),
  contactEmail: varchar({ length: 255 }),
  contactPhone: varchar({ length: 50 }),
  active: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => [
  check("colleges_active_check", sql`${table.active} IN (0, 1)`)
]);

export const studentsTable = pgTable("students", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id).unique(),
  name: varchar({ length: 150 }).notNull(),
  motherName: varchar({ length: 150 }).notNull(),
  cpf: varchar({ length: 14 }).notNull().unique(),
  rg: varchar({ length: 12 }).notNull().unique(),
  cin: varchar({ length: 11 }).unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 20 }).notNull().unique(),
  birthDate: date().notNull(),
  collegeId: integer().notNull().references(() => collegesTable.id),
  course: varchar({ length: 150 }).notNull(),
  semester: integer().notNull(),
  year: integer().notNull(),
  city: varchar({ length: 100 }).notNull(),
  neighborhood: varchar({ length: 100 }).notNull(),
  address: varchar({ length: 200 }).notNull(),
  cep: varchar({ length: 15 }).notNull(),
  photoUrl: varchar({ length: 255 }),
  residenceProofUrl: varchar({ length: 255 }),
  notes: varchar({ length: 1000 }),
  active: integer().notNull().default(1),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("student_active_check", sql`${table.active} IN (0, 1)`),
  check("student_year_semester_check", sql`${table.year} >= 2000 AND ${table.semester} IN (1, 2)`)
]);

export const enrollmentsTable = pgTable("enrollments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer().notNull().references(() => studentsTable.id),
  collegeId: integer().notNull().references(() => collegesTable.id),
  cardCode: char({ length: 12 }).notNull().unique(),
  course: varchar({ length: 150 }).notNull(),
  semester: integer().notNull(),
  year: integer().notNull(),
  monthlyFee: numeric({ precision: 10, scale: 2 }).notNull(),
  enrollmentFee: numeric({ precision: 10, scale: 2 }).notNull(),
  status: enrollmentStatusEnum().notNull().default(EnrollmentStatus.ACTIVE),
  photoUrl: varchar({ length: 255 }),
  residenceProofUrl: varchar({ length: 255 }),
  collegeEnrollmentUrl: varchar({ length: 255 }),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("enrollment_year_semester_check", sql`${table.year} >= 2000 AND ${table.semester} IN (1,2)`),
  unique("enrollment_unique_student_period").on(table.studentId, table.year, table.semester),
]);

export const payersTable = pgTable("payers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: payerTypeEnum().notNull(),
  studentId: integer().references(() => studentsTable.id),
  companyName: varchar({ length: 150 }),
  active: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  check("payers_active_check", sql`${table.active} IN (0, 1)`)
]);

export const pricesTable = pgTable("prices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  type: accountReceivableTypeEnum().notNull().unique(),
  paymentType: paymentTypeEnum().default(PaymentType.ANY).notNull(),
  dueDate: date().notNull(),
  active: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("prices_table_active_check", sql`${table.active} IN (0, 1)`)
]);

export const accountsReceivableTable = pgTable("accounts_receivable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  payerId: integer().notNull().references(() => payersTable.id),
  enrollmentId: integer().references(() => enrollmentsTable.id),
  description: varchar({ length: 200 }),
  amount: numeric({ precision: 10, scale: 2 }).notNull(),
  dueDate: date().notNull(),
  accountReceivableType: accountReceivableTypeEnum().notNull(),
  paymentType: paymentTypeEnum().notNull().default(PaymentType.ANY),
  status: accountStatusEnum().notNull().default(AccountStatus.OPEN),
  paymentDate: date(),
  paymentProofUrl: varchar({ length: 255 }),
  paymentProofType: paymentProofTypeEnum(),
  active: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [check("payment_proof_check", sql`${table.paymentProofUrl} IS NULL OR ${table.status} = 'PAID'`)]);

/**
 * Cobranca criada num gateway de pagamento para quitar uma conta a receber.
 *
 * Uma conta pode acumular varias cobrancas ao longo do tempo (um Pix que
 * expirou, um boleto emitido depois, um cartao recusado). Por isso a relacao e
 * 1:N e nao uma coluna extra em `accounts_receivable`.
 *
 * Nada aqui e dado sensivel de cartao: a AbacatePay nao expoe PAN, e o fluxo de
 * cartao acontece inteiramente no checkout hospedado dela.
 */
export const paymentChargesTable = pgTable("payment_charges", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountReceivableId: integer().notNull().references(() => accountsReceivableTable.id),
  provider: paymentProviderEnum().notNull().default(PaymentProvider.ABACATEPAY),
  /** Id da cobranca no gateway (`pix_...`, `bill_...`). Nulo so entre o INSERT e a resposta do gateway. */
  providerChargeId: varchar({ length: 100 }),
  /**
   * Chave de idempotencia gerada por nos e enviada ao gateway como `externalId`.
   * Garante que um retry da requisicao nao gere duas cobrancas para a mesma conta.
   */
  externalId: varchar({ length: 100 }).notNull().unique(),
  method: chargeMethodEnum().notNull(),
  status: chargeStatusEnum().notNull().default(ChargeStatus.PENDING),
  /** Valor em centavos, como o gateway trabalha. A conversao a partir de `numeric(10,2)` acontece no service. */
  amountCents: integer().notNull(),
  /** Pix copia-e-cola. O QR e desenhado no app a partir daqui; nao guardamos o PNG. */
  brCode: varchar({ length: 1000 }),
  /** Linha digitavel do boleto. */
  barCode: varchar({ length: 100 }),
  /** URL do boleto para impressao, ou do checkout hospedado no caso de cartao. */
  paymentUrl: varchar({ length: 500 }),
  expiresAt: timestamp(),
  paidAt: timestamp(),
  /** Ultima vez que reconciliamos com o gateway, para nao consultar em excesso. */
  lastCheckedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  index("payment_charges_account_idx").on(table.accountReceivableId),
  index("payment_charges_provider_charge_idx").on(table.providerChargeId),
]);

/**
 * Eventos de webhook ja processados.
 *
 * O gateway reenvia eventos ate receber 2xx, entao a mesma notificacao de
 * pagamento chega mais de uma vez. A unicidade de `eventKey` transforma o
 * reprocessamento num no-op em vez de uma segunda baixa na conta.
 */
export const webhookEventsTable = pgTable("webhook_events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  provider: paymentProviderEnum().notNull().default(PaymentProvider.ABACATEPAY),
  /** Identificador estavel do evento: id do proprio evento, ou `<tipo>:<id da cobranca>`. */
  eventKey: varchar({ length: 200 }).notNull().unique(),
  eventType: varchar({ length: 100 }).notNull(),
  payload: jsonb().notNull(),
  processedAt: timestamp().notNull().defaultNow()
});

export const vehiclesTable = pgTable("vehicles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  plate: varchar({ length: 10 }).notNull().unique(),
  model: varchar({ length: 50 }).notNull(),
  type: vehicleTypeEnum().notNull(),
  capacity: integer().notNull(),
  active: integer().notNull(),
  notes: varchar({ length: 1000 }),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("vehicle_active_check", sql`${table.active} IN (0, 1)`)
]);

export const stopsTable = pgTable("stops", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 150 }).notNull(),
  city: varchar({ length: 100 }).notNull(),
  neighborhood: varchar({ length: 100 }).notNull(),
  address: varchar({ length: 200 }).notNull(),
  cep: varchar({ length: 15 }).notNull(),
  latitude: numeric({ precision: 10, scale: 7 }).notNull(),
  longitude: numeric({ precision: 10, scale: 7 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});

export const routesTable = pgTable("routes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 150 }).notNull(),
  vehicleId: integer().notNull().references(() => vehiclesTable.id),
  driverId: integer().notNull().references(() => driversTable.id),
  startLat: numeric({ precision: 10, scale: 7 }).notNull(), // Latitude do ponto inicial
  startLong: numeric({ precision: 10, scale: 7 }).notNull(), // Longitude do ponto inicial
  endLat: numeric({ precision: 10, scale: 7 }).notNull(), // Latitude do ponto final
  endLong: numeric({ precision: 10, scale: 7 }).notNull(), // Longitude do ponto final
  startTime: time().notNull(), // Horário de início da rota
  endTime: time(), // Horário de fim da rota
  estimatedDuration: integer().notNull(), // Duração estimada em minutos
  active: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  deletedAt: timestamp(),
}, (table) => [
  check("route_active_check", sql`${table.active} IN (0, 1)`)
]);

export const routeStopsTable = pgTable("route_stops", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routeId: integer().notNull().references(() => routesTable.id),
  stopId: integer().notNull().references(() => stopsTable.id),
  stopOrder: integer().notNull(),
  estimatedArrival: integer().notNull(), // Tempo estimado em minutos desde o início da rota
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  unique("unique_route_stop_order").on(table.routeId, table.stopOrder)
]);

export const cardValidationsTable = pgTable("card_validations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer().notNull().references(() => studentsTable.id),
  driverId: integer().notNull().references(() => driversTable.id),
  routeId: integer().notNull().references(() => routesTable.id),
  latitude: numeric({ precision: 10, scale: 7 }),
  longitude: numeric({ precision: 10, scale: 7 }),
  status: cardValidationStatusEnum().notNull(),
  validationTime: timestamp().notNull().defaultNow(),
});

export const studentRoutesTable = pgTable("student_routes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer().notNull().references(() => studentsTable.id),
  routeStopId: integer().notNull().references(() => routeStopsTable.id),
  routePeriod: routePeriodEnum().notNull(),
  departureTime: time().notNull(),
  returnTime: time().notNull(),
  startDate: date().notNull(),      // Data de início da rota
  endDate: date(),                  // Data de término da rota (fim de semestre)
  active: integer().notNull(),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, (table) => [
  check("student_route_active_check", sql`${table.active} IN (0, 1)`),
  unique("unique_student_route_time").on(table.studentId, table.routeStopId, table.routePeriod)
]);

export const auditLogsTable = pgTable("audit_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => usersTable.id),
  action: auditActionEnum().notNull(),
  entityType: varchar({ length: 100 }).notNull(),
  entityId: integer().notNull(),
  oldValues: jsonb(),
  newValues: jsonb(),
  ipAddress: varchar({ length: 50 }),
  userAgent: varchar({ length: 500 }),
  createdAt: timestamp().notNull().defaultNow(),
});
