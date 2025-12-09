import { enrollmentsApi } from '../api/enrollments';
import { paymentsApi } from '../api/payments';
import { studentsApi } from '../api/students';
import {
  AccountReceivable,
  AccountStatus,
  Enrollment,
  EnrollmentStatus,
  Student,
} from '../types';

function sortByUpdatedAtDesc<T extends { updatedAt?: string; createdAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

export function findStudentByUserId(students: Student[], userId?: string | number | null) {
  if (userId == null) return null;
  return students.find((student) => String(student.userId) === String(userId)) ?? null;
}

export function findEnrollmentByStudentId(enrollments: Enrollment[], studentId?: string | number | null) {
  if (studentId == null) return null;

  const studentEnrollments = enrollments.filter((enrollment) => {
    const directStudentId = enrollment.studentId;
    const nestedStudentId = enrollment.student?.id;
    return String(directStudentId ?? nestedStudentId) === String(studentId);
  });

  if (studentEnrollments.length === 0) return null;

  const activeEnrollment = studentEnrollments.find((enrollment) => enrollment.status === EnrollmentStatus.ACTIVE);
  if (activeEnrollment) return activeEnrollment;

  return sortByUpdatedAtDesc(studentEnrollments)[0] ?? null;
}

export function findPaymentsByEnrollmentId(payments: AccountReceivable[], enrollmentId?: string | number | null) {
  if (enrollmentId == null) return [];
  return payments.filter((payment) => String(payment.enrollmentId) === String(enrollmentId));
}

export function hasOpenPayments(payments: AccountReceivable[]) {
  return payments.some((payment) => payment.status === AccountStatus.OPEN);
}

export function isPassAvailable(enrollment: Enrollment | null, payments: AccountReceivable[]) {
  return enrollment?.status === EnrollmentStatus.ACTIVE && !hasOpenPayments(payments);
}

function normalizeEnrollment(enrollment: Enrollment | null) {
  if (!enrollment) return null;

  return {
    ...enrollment,
    startDate: enrollment.startDate ?? (enrollment as any).start_date ?? enrollment.createdAt,
  };
}

export async function loadStudentContext(userId?: string | number | null) {
  const emptyContext = {
    student: null,
    enrollment: null,
    payments: [],
    openPayments: [],
    nextOpenPayment: null,
    passAvailable: false,
  };

  if (userId == null) {
    return emptyContext;
  }

  const student = await studentsApi.getByUserId(String(userId));

  if (!student) {
    return emptyContext;
  }

  const [enrollments, payments] = await Promise.all([
    enrollmentsApi.getByStudentId(String(student.id)),
    paymentsApi.getByUserId(String(student.userId)),
  ]);

  const enrollmentResult = Array.isArray(enrollments)
    ? findEnrollmentByStudentId(enrollments, student.id)
    : enrollments;
  const enrollment = normalizeEnrollment(enrollmentResult);
  const studentWithPhoto = !student.photoUrl && enrollment?.student?.photoUrl
    ? { ...student, photoUrl: enrollment.student.photoUrl }
    : student;

  const currentEnrollmentPayments = findPaymentsByEnrollmentId(payments, enrollment?.id);

  const openPayments = currentEnrollmentPayments
    .filter((payment) => payment.status === AccountStatus.OPEN)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  return {
    student: studentWithPhoto,
    enrollment,
    payments: currentEnrollmentPayments,
    openPayments,
    nextOpenPayment: openPayments[0] ?? null,
    passAvailable: isPassAvailable(enrollment, currentEnrollmentPayments),
  };
}
