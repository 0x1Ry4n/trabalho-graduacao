import { DriverContractType } from "../../../shared/enums/index.enum";

export interface Driver {
    id: number;
    userId: number;
    name: string;
    motherName: string;
    cpf: string;
    cnpj: string | null;
    rg: string;
    licenseNumber: string;
    phone: string | null;
    email: string | null;
    birthDate: string;
    city: string;
    neighborhood: string;
    address: string;
    cep: string;
    companyName: string | null;
    contractType: DriverContractType;
    salary: string;
    admissionDate: string;
    rescissionDate: string | null;
    photoUrl: string | null;
    residenceProofUrl: string | null;
    active: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}