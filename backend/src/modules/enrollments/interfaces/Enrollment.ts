import { EnrollmentStatus } from "../../../shared/enums/enrollment-status.enum";

export interface Enrollment {
    id: number;
    student: {
        id: number,
        name: string,
        cpf: string,
        rg: string,
        phone: string,
        email: string,
        photoUrl: string | null,
        payerId: number | null,
    },
    cardCode: string;
    collegeId: number;
    collegeName: string;
    course: string;
    semester: number;
    year: number;
    monthlyFee: string;
    enrollmentFee: string;
    status: EnrollmentStatus;
    photoUrl: string | null;
    residenceProofUrl: string | null;
    collegeEnrollmentUrl: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
