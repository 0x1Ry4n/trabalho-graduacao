export interface Student {
    id: number;
    userId: number;
    name: string;
    motherName: string;
    cpf: string;
    rg: string;
    cin: string | null;
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
    photoUrl: string | null;
    residenceProofUrl: string | null;
    notes: string | null;
    active: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}