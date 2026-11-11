import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Movement,
  MovementAttachment,
  MovementType,
  MovementWithDetails,
} from '@/types/models';
import { nowISO } from '@/utils/dates';

export type MovementInput = {
  type: MovementType;
  amount: number;
  account_id: number;
  destination_account_id?: number | null;
  category_id?: number | null;
  description?: string;
  notes?: string | null;
  occurred_at?: string;
};

export type MovementFilters = {
  type?: MovementType;
  account_id?: number;
  destination_account_id?: number;
  category_id?: number;
  from?: string;
  to?: string;
  search?: string;
  includeDeleted?: boolean;
};

export type AttachmentInput = {
  file_path: string;
  file_name: string;
  mime_type: string;
  size: number;
};

export type PeriodSummary = {
  income: number;
  expense: number;
};

const SELECT_MOVEMENTS = `
SELECT
  m.*,
  a.name AS account_name,
  a.type AS account_type,
  da.name AS destination_account_name,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  (SELECT COUNT(*) FROM movement_attachments ma WHERE ma.movement_id = m.id) AS attachment_count
FROM movements m
JOIN accounts a ON a.id = m.account_id
LEFT JOIN accounts da ON da.id = m.destination_account_id
LEFT JOIN categories c ON c.id = m.category_id
`;

function validateInput(input: MovementInput): void {
  if (!(input.amount > 0)) {
    throw new Error('El importe debe ser mayor a cero');
  }
  if (input.type === 'transfer') {
    if (!input.destination_account_id) {
      throw new Error('Una transferencia requiere una cuenta de destino');
    }
    if (input.destination_account_id === input.account_id) {
      throw new Error('Las cuentas de origen y destino deben ser distintas');
    }
    if (input.category_id) {
      throw new Error('Una transferencia no admite categoría');
    }
  } else if (!Number.isFinite(input.amount)) {
    throw new Error('Importe inválido');
  }
}

export function movementsRepository(db: SQLiteDatabase) {
  async function create(input: MovementInput): Promise<number> {
    validateInput(input);
    const now = nowISO();
    const result = await db.runAsync(
      `INSERT INTO movements (type, amount, account_id, destination_account_id, category_id, description, notes, occurred_at, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        input.type,
        input.amount,
        input.account_id,
        input.type === 'transfer' ? input.destination_account_id! : null,
        input.type === 'transfer' ? null : (input.category_id ?? null),
        input.description?.trim() ?? '',
        input.notes ?? null,
        input.occurred_at ?? now,
        now,
        now,
      ]
    );
    return result.lastInsertRowId;
  }

  async function update(id: number, input: MovementInput): Promise<void> {
    validateInput(input);
    const movement = await getById(id);
    if (!movement) {
      throw new Error(`No existe el movimiento ${id}`);
    }
    await db.runAsync(
      `UPDATE movements
       SET type = ?, amount = ?, account_id = ?, destination_account_id = ?, category_id = ?, description = ?, notes = ?, occurred_at = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.type,
        input.amount,
        input.account_id,
        input.type === 'transfer' ? input.destination_account_id! : null,
        input.type === 'transfer' ? null : (input.category_id ?? null),
        input.description?.trim() ?? '',
        input.notes ?? null,
        input.occurred_at ?? movement.occurred_at,
        nowISO(),
        id,
      ]
    );
  }

  async function remove(id: number): Promise<MovementAttachment[]> {
    const attachments = await getAttachments(id);
    await db.runAsync('DELETE FROM movements WHERE id = ?', id);
    return attachments;
  }

  async function softDelete(id: number): Promise<void> {
    await db.runAsync('UPDATE movements SET is_deleted = 1, updated_at = ? WHERE id = ?', [nowISO(), id]);
  }

  async function restore(id: number): Promise<void> {
    await db.runAsync('UPDATE movements SET is_deleted = 0, updated_at = ? WHERE id = ?', [nowISO(), id]);
  }

  async function getById(id: number): Promise<Movement | null> {
    return db.getFirstAsync<Movement>('SELECT * FROM movements WHERE id = ?', id);
  }

  async function getWithDetails(id: number): Promise<MovementWithDetails | null> {
    return db.getFirstAsync<MovementWithDetails>(`${SELECT_MOVEMENTS} WHERE m.id = ?`, id);
  }

  async function list(
    filters: MovementFilters = {},
    limit = 30,
    offset = 0
  ): Promise<{ items: MovementWithDetails[]; total: number }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (!filters.includeDeleted) {
      conditions.push('m.is_deleted = 0');
    }
    if (filters.type) {
      conditions.push('m.type = ?');
      params.push(filters.type);
    }
    if (filters.account_id) {
      conditions.push('(m.account_id = ? OR m.destination_account_id = ?)');
      params.push(filters.account_id, filters.account_id);
    }
    if (filters.category_id) {
      conditions.push('m.category_id = ?');
      params.push(filters.category_id);
    }
    if (filters.from) {
      conditions.push('m.occurred_at >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('m.occurred_at <= ?');
      params.push(`${filters.to}T23:59:59.999Z`);
    }
    if (filters.search) {
      conditions.push('(m.description LIKE ? OR m.notes LIKE ?)');
      const pattern = `%${filters.search}%`;
      params.push(pattern, pattern);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const items = await db.getAllAsync<MovementWithDetails>(
      `${SELECT_MOVEMENTS} ${where} ORDER BY m.occurred_at DESC, m.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const totalResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM movements m ${where}`,
      params
    );

    return { items, total: totalResult?.count ?? 0 };
  }

  async function getAttachments(movementId: number): Promise<MovementAttachment[]> {
    return db.getAllAsync<MovementAttachment>(
      'SELECT * FROM movement_attachments WHERE movement_id = ? ORDER BY id',
      movementId
    );
  }

  async function addAttachment(movementId: number, input: AttachmentInput): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO movement_attachments (movement_id, file_path, file_name, mime_type, size, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [movementId, input.file_path, input.file_name, input.mime_type, input.size, nowISO()]
    );
    return result.lastInsertRowId;
  }

  async function removeAttachment(attachmentId: number): Promise<MovementAttachment | null> {
    const attachment = await db.getFirstAsync<MovementAttachment>(
      'SELECT * FROM movement_attachments WHERE id = ?',
      attachmentId
    );
    await db.runAsync('DELETE FROM movement_attachments WHERE id = ?', attachmentId);
    return attachment;
  }

  async function getSummary(from: string, to: string): Promise<PeriodSummary> {
    const result = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM movements
       WHERE is_deleted = 0 AND occurred_at >= ? AND occurred_at <= ?`,
      [from, `${to}T23:59:59.999Z`]
    );
    return {
      income: result?.income ?? 0,
      expense: result?.expense ?? 0,
    };
  }

  return {
    create,
    update,
    remove,
    softDelete,
    restore,
    getById,
    getWithDetails,
    list,
    getSummary,
    getAttachments,
    addAttachment,
    removeAttachment,
  };
}
