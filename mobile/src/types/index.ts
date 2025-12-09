// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'STUDENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  FINISHED = 'FINISHED',
}

export enum AccountStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
}

export enum CardValidationStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
}

export enum VehicleCategory {
  MICROBUS = 'MICROBUS',
  BUS = 'BUS',
  VAN = 'VAN',
}

export enum ContractType {
  CLT = 'CLT',
  PJ = 'PJ',
  FREELANCER = 'FREELANCER',
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  active: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export type UpdateUserDto = Partial<CreateUserDto>;

// ─── College / Institution ─────────────────────────────────────────────────────

export interface College {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  contactEmail?: string;
  contactPhone?: string;
  active: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollegeDto {
  name: string;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type UpdateCollegeDto = Partial<CreateCollegeDto>;

// ─── Driver ───────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  userId: number;
  name: string;
  motherName: string;
  cpf: string;
  cnpj?: string;
  rg: string;
  birthDate: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  companyName?: string;
  contractType: ContractType;
  salary: string;
  admissionDate: string;
  rescissionDate?: string;
  photoUrl?: string;
  residenceProofUrl?: string;
  active: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverDto {
  userId: number;
  name: string;
  motherName: string;
  cpf: string;
  cnpj?: string;
  rg: string;
  birthDate: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  companyName?: string;
  contractType: ContractType;
  salary: number;
  admissionDate: string;
}

export type UpdateDriverDto = Partial<Omit<CreateDriverDto, 'userId'>>;

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  userId: number;
  name: string;
  motherName: string;
  cpf: string;
  rg: string;
  cin?: string;
  phone: string;
  email: string;
  birthDate: string;
  collegeId: number;
  course: string;
  semester: number;
  year: number;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  notes?: string;
  photoUrl?: string;
  residenceProofUrl?: string;
  active: number;
  createdAt: string;
  updatedAt: string;
  enrollment?: Enrollment;
}

export interface CreateStudentDto {
  userId: number;
  name: string;
  motherName: string;
  cpf: string;
  rg: string;
  cin?: string;
  phone: string;
  email: string;
  birthDate: string;
  collegeId: number;
  course: string;
  semester: number;
  year: number;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  notes?: string;
}

export type UpdateStudentDto = Partial<Omit<CreateStudentDto, 'userId'> & Pick<Student, 'photoUrl' | 'residenceProofUrl'>>;

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: VehicleCategory;
  capacity: number;
  notes?: string;
  active: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateVehicleDto {
  plate: string;
  model: string;
  type: VehicleCategory;
  capacity: number;
  notes?: string;
  active: number;
}

export type UpdateVehicleDto = Partial<CreateVehicleDto>;
export interface Stop {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}

export interface RouteStop extends Stop {
  routeStopId?: string;
  routeId?: string;
  stopId?: string;
  stopOrder?: number;
  estimatedArrival?: number;
}

export interface RouteStopLink {
  id: string;
  routeId: string;
  stopId: string;
  stopOrder: number;
  estimatedArrival: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStopDto {
  name: string;
  city: string;
  neighborhood: string;
  address: string;
  cep: string;
  latitude: string;
  longitude: string;
}

export type UpdateStopDto = Partial<CreateStopDto>;
export type RoutePeriod = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export interface Route {
  id: string;
  name: string;
  vehicleId: number;
  driverId: number;
  startLat: string;
  startLong: string;
  endLat: string;
  endLong: string;
  startTime: string;
  endTime?: string;
  estimatedDuration: number;
  active: number;
  driver?: Driver;
  vehicle?: Vehicle;
  stops?: RouteStop[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateRouteDto {
  name: string;
  vehicleId: number;
  driverId: number;
  startLat: string;
  startLong: string;
  endLat: string;
  endLong: string;
  startTime: string;
  endTime?: string;
  estimatedDuration: number;
  active: number;
}

export type UpdateRouteDto = Partial<CreateRouteDto>;

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;
  studentId?: string;
  payerId?: number | null;
  collegeId: number;
  collegeName?: string;
  status: EnrollmentStatus;
  cardCode: string;
  course: string;
  semester: number;
  year: number;
  startDate: string;
  endDate?: string;
  monthlyFee?: number;
  enrollmentFee?: number;
  photoUrl?: string;
  residenceProofUrl?: string;
  collegeEnrollmentUrl?: string;
  student?: Student;
  college?: College;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentDto {
  studentId: number;
  collegeId: number;
  course: string;
  semester: number;
  year: number;
  monthlyFee: number;
  enrollmentFee: number;
  photoUrl?: string;
  residenceProofUrl?: string;
  collegeEnrollmentUrl?: string;
}

export interface UpdateEnrollmentDto {
  status?: EnrollmentStatus;
  residenceProofUrl?: string;
  collegeEnrollmentUrl?: string;
}

// ─── Account Receivable ───────────────────────────────────────────────────────

export interface AccountReceivable {
  id: string;
  enrollmentId: string;
  payerId?: number;
  amount: number;
  dueDate: string;
  accountReceivableType?: AccountReceivableType;
  paymentType?: PaymentType;
  status: AccountStatus;
  paymentDate?: string;
  paymentProofUrl?: string;
  paymentProofType?: string;
  description?: string;
  enrollment?: Enrollment;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccountReceivableDto {
  status?: AccountStatus;
  paymentDate?: string;
}

export interface CreateAccountReceivableDto {
  payerId: number;
  enrollmentId: number;
  description: string;
  amount: number;
  dueDate: string;
  accountReceivableType: AccountReceivableType;
  paymentType: PaymentType;
  status: AccountStatus;
}

// ─── Card Validation ──────────────────────────────────────────────────────────

export interface CardValidation {
  id: string;
  studentId: string;
  driverId: string;
  routeId?: string;
  latitude?: number;
  longitude?: number;
  status: CardValidationStatus;
  timestamp?: string;
  validationTime?: string;
  student?: Student;
  driver?: Driver;
  route?: Route;
}

export interface CreateCardValidationDto {
  studentId: number;
  driverId: number;
  routeId: number;
  latitude?: number | null;
  longitude?: number | null;
  status: CardValidationStatus;
  validationTime?: string;
}

// ─── Price Table ─────────────────────────────────────────────────────────────

export enum AccountReceivableType {
  ENROLLMENT_FEE = 'ENROLLMENT_FEE',
  MONTHLY_FEE = 'MONTHLY_FEE',
}

export enum PaymentType {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ANY = 'ANY',
}

export interface PriceTable {
  id: string;
  price: number;
  type: AccountReceivableType;
  paymentType: PaymentType;
  dueDate: string;
  active: number;
  createdAt: string;
}

export interface CreatePriceTableDto {
  price: number;
  type: AccountReceivableType;
  paymentType: PaymentType;
  dueDate: string;
  active?: number;
}

export interface UpdatePriceTableDto {
  price?: number;
  dueDate?: string;
  active?: number;
}

export interface CreateStudentRouteDto {
  studentId: number;
  routeStopId: number;
  routePeriod: RoutePeriod;
  departureTime: string;
  returnTime: string;
  startDate: string;
  endDate?: string;
  active: number;
}

export interface StudentRoute {
  id: string;
  studentId: string;
  routeStopId: string;
  routePeriod: RoutePeriod;
  departureTime: string;
  returnTime: string;
  startDate: string;
  endDate?: string | null;
  active: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Offline / Sync ───────────────────────────────────────────────────────────

export interface PendingValidation {
  id: string;
  studentId: string;
  driverId: string;
  routeId: string | null;
  latitude: number | null;
  longitude: number | null;
  status: CardValidationStatus;
  timestamp: string;
  synced: boolean;
}

export interface CachedStudent {
  id: string;
  name: string;
  cpf: string;
  cardCode: string;
  enrollmentStatus: EnrollmentStatus | null;
  enrollmentId: string | null;
  photoUrl: string | null;
  syncedAt: string;
}
