import { getDatabase } from './db';
import { PendingValidation, CardValidationStatus } from '../types';

interface ValidationRow {
  id: string;
  student_id: string;
  driver_id: string;
  route_id: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  timestamp: string;
  synced: number;
}

function rowToValidation(row: ValidationRow): PendingValidation {
  return {
    id: row.id,
    studentId: row.student_id,
    driverId: row.driver_id,
    routeId: row.route_id ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    status: row.status as CardValidationStatus,
    timestamp: row.timestamp,
    synced: row.synced === 1,
  };
}

export async function insertValidation(
  validation: PendingValidation,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO pending_validations
      (id, student_id, driver_id, route_id, latitude, longitude, status, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      validation.id,
      validation.studentId,
      validation.driverId,
      validation.routeId ?? null,
      validation.latitude ?? null,
      validation.longitude ?? null,
      validation.status,
      validation.timestamp,
      validation.synced ? 1 : 0,
    ],
  );
}

export async function getPendingValidations(): Promise<PendingValidation[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ValidationRow>(
    'SELECT * FROM pending_validations ORDER BY timestamp DESC',
  );
  return rows.map(rowToValidation);
}

export async function getUnsyncedValidations(): Promise<PendingValidation[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ValidationRow>(
    'SELECT * FROM pending_validations WHERE synced = 0 ORDER BY timestamp ASC',
  );
  return rows.map(rowToValidation);
}

export async function markValidationSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE pending_validations SET synced = 1 WHERE id = ?',
    [id],
  );
}
