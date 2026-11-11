import type { SQLiteDatabase } from 'expo-sqlite';

import {
  movementsRepository,
  type MovementFilters,
  type MovementInput,
  type PeriodSummary,
} from '@/db/repositories/movements';
import {
  deleteAttachmentFile,
  persistAttachment,
  type PendingAttachment,
} from '@/services/attachments';
import type { MovementAttachment, MovementWithDetails } from '@/types/models';

export async function createMovement(db: SQLiteDatabase, input: MovementInput): Promise<number> {
  let createdId = 0;
  await db.withTransactionAsync(async () => {
    createdId = await movementsRepository(db).create(input);
  });
  return createdId;
}

export async function updateMovement(
  db: SQLiteDatabase,
  id: number,
  input: MovementInput
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await movementsRepository(db).update(id, input);
  });
}

export async function deleteMovement(db: SQLiteDatabase, id: number): Promise<void> {
  let attachments: MovementAttachment[] = [];
  await db.withTransactionAsync(async () => {
    attachments = await movementsRepository(db).remove(id);
  });
  for (const attachment of attachments) {
    deleteAttachmentFile(attachment.file_path);
  }
}

export async function getMovementWithDetails(
  db: SQLiteDatabase,
  id: number
): Promise<MovementWithDetails | null> {
  return movementsRepository(db).getWithDetails(id);
}

export async function getMovementAttachments(
  db: SQLiteDatabase,
  movementId: number
): Promise<MovementAttachment[]> {
  return movementsRepository(db).getAttachments(movementId);
}

export async function saveMovementAttachments(
  db: SQLiteDatabase,
  movementId: number,
  toAdd: PendingAttachment[],
  toRemove: MovementAttachment[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const attachment of toRemove) {
      await movementsRepository(db).removeAttachment(attachment.id);
    }
    for (const pending of toAdd) {
      const persisted = persistAttachment(pending);
      await movementsRepository(db).addAttachment(movementId, {
        file_path: persisted.file_path,
        file_name: persisted.file_name,
        mime_type: persisted.mime_type,
        size: persisted.size,
      });
    }
  });
  for (const attachment of toRemove) {
    deleteAttachmentFile(attachment.file_path);
  }
}

export async function listMovements(
  db: SQLiteDatabase,
  filters: MovementFilters,
  limit: number,
  offset: number
): Promise<{ items: MovementWithDetails[]; total: number }> {
  return movementsRepository(db).list(filters, limit, offset);
}

export async function getPeriodSummary(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<PeriodSummary> {
  return movementsRepository(db).getSummary(from, to);
}
