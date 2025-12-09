import { getDatabase } from './db';
import { CachedStudent, EnrollmentStatus } from '../types';

interface StudentRow {
  id: string;
  name: string;
  cpf: string;
  card_code: string;
  enrollment_status: string | null;
  enrollment_id: string | null;
  photo_url: string | null;
  synced_at: string;
}

function rowToStudent(row: StudentRow): CachedStudent {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    cardCode: row.card_code,
    enrollmentStatus: (row.enrollment_status as EnrollmentStatus) ?? null,
    enrollmentId: row.enrollment_id ?? null,
    photoUrl: row.photo_url ?? null,
    syncedAt: row.synced_at,
  };
}

export async function upsertStudent(student: CachedStudent): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO students_cache
      (id, name, cpf, card_code, enrollment_status, enrollment_id, photo_url, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student.id,
      student.name,
      student.cpf,
      student.cardCode,
      student.enrollmentStatus ?? null,
      student.enrollmentId ?? null,
      student.photoUrl ?? null,
      student.syncedAt,
    ],
  );
}

export async function upsertStudents(students: CachedStudent[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const student of students) {
      await db.runAsync(
        `INSERT OR REPLACE INTO students_cache
          (id, name, cpf, card_code, enrollment_status, enrollment_id, photo_url, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.id,
          student.name,
          student.cpf,
          student.cardCode,
          student.enrollmentStatus ?? null,
          student.enrollmentId ?? null,
          student.photoUrl ?? null,
          student.syncedAt,
        ],
      );
    }
  });
}

export async function findStudentByCardCode(
  cardCode: string,
): Promise<CachedStudent | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<StudentRow>(
    'SELECT * FROM students_cache WHERE card_code = ?',
    [cardCode],
  );
  return row ? rowToStudent(row) : null;
}

export async function getAllCachedStudents(): Promise<CachedStudent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StudentRow>(
    'SELECT * FROM students_cache ORDER BY name',
  );
  return rows.map(rowToStudent);
}

export async function getCachedStudentCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM students_cache',
  );
  return result?.count ?? 0;
}
